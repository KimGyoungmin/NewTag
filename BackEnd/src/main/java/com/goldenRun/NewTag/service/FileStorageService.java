package com.goldenRun.NewTag.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@Slf4j
public class FileStorageService {

    @Value("${app.upload.base-dir:BackEnd/src/main/resources/static}")
    private String baseDir;

    @Value("${app.upload.product-dir:products}")
    private String productDir;

    /**
     * 상품 이미지 임시 저장 (상품 ID 없을 때)
     * @param file 업로드할 파일
     * @return DB 저장용 경로 (예: "products/temp/abc123.jpg")
     */
    public String store(MultipartFile file) {
        return storeProductImage(file, null, false);
    }

    /**
     * 상품 이미지 저장
     * @param file 업로드할 파일
     * @param productId 상품 ID (null이면 temp 폴더)
     * @param isMain 메인 이미지 여부
     * @return DB 저장용 경로 (예: "products/1/main.jpg")
     */
    public String storeProductImage(MultipartFile file, Long productId, boolean isMain) {
        validateFile(file);

        String extension = getFileExtension(file.getOriginalFilename());
        String filename = generateFilename(isMain, extension);
        String folder = productId != null ? String.valueOf(productId) : "temp";

        try {
            // products/{productId}/ 폴더 생성
            Path productFolder = Paths.get(baseDir, productDir, folder).toAbsolutePath().normalize();
            Files.createDirectories(productFolder);

            // 파일 저장
            Path targetLocation = productFolder.resolve(filename);
            file.transferTo(targetLocation);

            // DB 저장용 경로 반환 (products/1/main.jpg)
            String relativePath = productDir + "/" + folder + "/" + filename;
            log.info("✅ Stored product image: {}", targetLocation);
            return relativePath.replace("\\", "/");

        } catch (IOException e) {
            log.error("❌ Failed to store image", e);
            throw new RuntimeException("이미지 업로드에 실패했습니다: " + e.getMessage());
        }
    }

    /**
     * 임시 폴더의 이미지를 상품 폴더로 이동
     * @param tempPath 임시 경로 (예: "products/temp/abc123.jpg")
     * @param productId 상품 ID
     * @param isMain 메인 이미지 여부
     * @return 새 경로 (예: "products/1/main.jpg")
     */
    public String moveToProductFolder(String tempPath, Long productId, boolean isMain) {
        if (tempPath == null || !tempPath.startsWith(productDir + "/temp/")) {
            return tempPath; // 이미 상품 폴더에 있거나 잘못된 경로
        }

        try {
            // 기존 파일 경로
            Path sourcePath = Paths.get(baseDir, tempPath).toAbsolutePath().normalize();
            if (!Files.exists(sourcePath)) {
                log.warn("⚠️ Source file not found: {}", sourcePath);
                return tempPath;
            }

            // 새 파일 경로
            String extension = getFileExtension(tempPath);
            String newFilename = generateFilename(isMain, extension);
            Path targetFolder = Paths.get(baseDir, productDir, String.valueOf(productId)).toAbsolutePath().normalize();
            Files.createDirectories(targetFolder);

            Path targetPath = targetFolder.resolve(newFilename);

            // 파일 이동
            Files.move(sourcePath, targetPath);

            String newPath = productDir + "/" + productId + "/" + newFilename;
            log.info("📦 Moved image: {} → {}", tempPath, newPath);
            return newPath.replace("\\", "/");

        } catch (IOException e) {
            log.error("❌ Failed to move image", e);
            return tempPath; // 이동 실패 시 기존 경로 유지
        }
    }

    /**
     * 상품 폴더 전체 삭제
     * @param productId 상품 ID
     */
    public void deleteProductFolder(Long productId) {
        try {
            Path productFolder = Paths.get(baseDir, productDir, String.valueOf(productId)).toAbsolutePath().normalize();
            if (Files.exists(productFolder)) {
                Files.walk(productFolder)
                    .sorted((a, b) -> b.compareTo(a)) // 역순 정렬 (파일 먼저 삭제)
                    .forEach(path -> {
                        try {
                            Files.delete(path);
                        } catch (IOException e) {
                            log.error("Failed to delete: {}", path, e);
                        }
                    });
                log.info("🗑️ Deleted product folder: {}", productFolder);
            }
        } catch (IOException e) {
            log.error("❌ Failed to delete product folder {}", productId, e);
        }
    }

    /**
     * 특정 이미지 파일 삭제
     * @param relativePath DB에 저장된 경로 (예: "products/1/main.jpg")
     */
    public void deleteFile(String relativePath) {
        if (relativePath == null || relativePath.isEmpty()) {
            return;
        }

        try {
            Path filePath = Paths.get(baseDir, relativePath).toAbsolutePath().normalize();
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                log.info("🗑️ Deleted file: {}", filePath);
            }
        } catch (IOException e) {
            log.error("❌ Failed to delete file: {}", relativePath, e);
        }
    }

    // ==================== Private Helper Methods ====================

    /**
     * 파일 유효성 검증
     */
    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("업로드할 이미지가 없습니다.");
        }

        // 파일 타입 검증
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("이미지 파일만 업로드 가능합니다.");
        }

        // 파일 크기 검증 (10MB)
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new IllegalArgumentException("파일 크기는 10MB를 초과할 수 없습니다.");
        }

        // 확장자 검증
        String extension = getFileExtension(file.getOriginalFilename()).toLowerCase();
        if (!extension.matches("\\.(jpg|jpeg|png|gif|webp)")) {
            throw new IllegalArgumentException("지원하지 않는 이미지 형식입니다. (jpg, jpeg, png, gif, webp만 가능)");
        }
    }

    /**
     * 파일 확장자 추출
     */
    private String getFileExtension(String filename) {
        if (filename == null) {
            return "";
        }
        int lastDot = filename.lastIndexOf(".");
        return lastDot >= 0 ? filename.substring(lastDot) : "";
    }

    /**
     * 파일명 생성
     */
    private String generateFilename(boolean isMain, String extension) {
        if (isMain) {
            return "main" + extension;
        } else {
            return "sub_" + UUID.randomUUID().toString().replace("-", "").substring(0, 8) + extension;
        }
    }
}
