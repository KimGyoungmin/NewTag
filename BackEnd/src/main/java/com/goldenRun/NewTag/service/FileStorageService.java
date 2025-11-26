package com.goldenRun.NewTag.service;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnails;
import net.coobird.thumbnailator.geometry.Positions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@Slf4j
public class FileStorageService {

    @Value("${app.upload.base-dir:BackEnd/src/main/resources/static}")
    private String baseDir;

    @Value("${app.upload.product-dir:products}")
    private String productDir;

    @Value("${app.upload.profile-base-dir:BackEnd/src/main/resources/userprofile}")
    private String profileBaseDir;

    @Value("${app.upload.profile-dir:userprofile}")
    private String profileDir;

    private static final int OPTIMIZE_MAX_WIDTH = 1600;
    private static final int OPTIMIZE_MAX_HEIGHT = 1600;
    private static final double OPTIMIZE_QUALITY = 0.85;
    private static final int THUMBNAIL_SIZE = 300;

    private Path baseDirectoryPath;
    private Path profileBaseDirectoryPath;

    @PostConstruct
    void init() {
        this.baseDirectoryPath = Paths.get(baseDir).toAbsolutePath().normalize();
        this.profileBaseDirectoryPath = Paths.get(profileBaseDir).toAbsolutePath().normalize();
    }

    /**
     * 임시 이미지 저장 (상품 ID 미지정)
     */
    public String store(MultipartFile file) {
        return storeProductImage(file, null, false);
    }

    /**
     * 상품 이미지 저장
     */
    public String storeProductImage(MultipartFile file, Long productId, boolean isMain) {
        validateFile(file);

        String extension = getFileExtension(file.getOriginalFilename());
        String filename = generateFilename(isMain, extension);
        String folder = productId != null ? String.valueOf(productId) : "temp";

        try {
            Path productFolder = getProductFolder(folder);
            Files.createDirectories(productFolder);

            Path targetLocation = productFolder.resolve(filename);
            file.transferTo(targetLocation);

            optimizeImageFile(targetLocation);
            createThumbnailFile(targetLocation);

            String relativePath = productDir + "/" + folder + "/" + filename;
            log.info("✅ Stored product image: {}", targetLocation);
            return relativePath.replace("\\", "/");

        } catch (IOException e) {
            log.error("❌ Failed to store image", e);
            throw new RuntimeException("이미지 업로드에 실패했습니다: " + e.getMessage());
        }
    }

    /**
     * 프로필 이미지 저장
     */
    public String storeProfileImage(MultipartFile file, String folderName) {
        validateFile(file);

        String extension = getFileExtension(file.getOriginalFilename());
        String filename = "profile_" + UUID.randomUUID().toString().replace("-", "").substring(0, 10) + extension;
        String folder = (folderName != null && !folderName.isBlank()) ? folderName : "temp";

        try {
            Path userFolder = getProfileFolder(folder);
            Files.createDirectories(userFolder);

            Path targetLocation = userFolder.resolve(filename);
            file.transferTo(targetLocation);

            optimizeImageFile(targetLocation);

            String relativePath = profileDir + "/" + folder + "/" + filename;
            log.info("Stored profile image: {}", targetLocation);
            return relativePath.replace("\\", "/");
        } catch (IOException e) {
            log.error("Failed to store profile image", e);
            throw new RuntimeException("프로필 이미지를 저장하지 못했습니다: " + e.getMessage());
        }
    }

    /**
     * 채팅 이미지 저장
     */
    public String storeChatImage(MultipartFile file, String folder) {
        validateFile(file);

        String extension = getFileExtension(file.getOriginalFilename());
        String filename = "chat_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().replace("-", "").substring(0, 8) + extension;

        try {
            Path chatFolder = baseDirectoryPath.resolve(folder).normalize();
            Files.createDirectories(chatFolder);

            Path targetLocation = chatFolder.resolve(filename);
            file.transferTo(targetLocation);

            optimizeImageFile(targetLocation);

            String relativePath = folder + "/" + filename;
            log.info("✅ Stored chat image: {}", targetLocation);
            return relativePath.replace("\\", "/");

        } catch (IOException e) {
            log.error("❌ Failed to store chat image", e);
            throw new RuntimeException("채팅 이미지 업로드에 실패했습니다: " + e.getMessage());
        }
    }

    /**
     * temp 폴더 이미지를 상품 폴더로 이동
     */
    public String moveToProductFolder(String tempPath, Long productId, boolean isMain) {
        if (tempPath == null || !tempPath.startsWith(productDir + "/temp/")) {
            return tempPath;
        }

        try {
            Path sourcePath = getAbsolutePath(tempPath);
            if (!Files.exists(sourcePath)) {
                log.warn("⚠️ Source file not found: {}", sourcePath);
                return tempPath;
            }

            String extension = getFileExtension(tempPath);
            String newFilename = generateFilename(isMain, extension);
            Path targetFolder = getProductFolder(String.valueOf(productId));
            Files.createDirectories(targetFolder);

            Path targetPath = targetFolder.resolve(newFilename);
            Files.move(sourcePath, targetPath, StandardCopyOption.REPLACE_EXISTING);

            moveThumbnailIfExists(tempPath, productId, newFilename);

            String newPath = productDir + "/" + productId + "/" + newFilename;
            log.info("✅ Moved image: {} -> {}", tempPath, newPath);
            return newPath.replace("\\", "/");

        } catch (IOException e) {
            log.error("❌ Failed to move image", e);
            return tempPath;
        }
    }

    /**
     * 상품 이미지 폴더 삭제
     */
    public void deleteProductFolder(Long productId) {
        try {
            Path productFolder = getProductFolder(String.valueOf(productId));
            if (Files.exists(productFolder)) {
                Files.walk(productFolder)
                        .sorted((a, b) -> b.compareTo(a))
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
     * 단일 이미지/썸네일 삭제
     */
    public void deleteFile(String relativePath) {
        if (relativePath == null || relativePath.isEmpty()) {
            return;
        }

        try {
            Path filePath = getAbsolutePath(relativePath);
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                log.info("🗑️ Deleted file: {}", filePath);
            }

            String thumbRelative = buildThumbnailPath(relativePath);
            if (thumbRelative != null) {
                Path thumbPath = getAbsolutePath(thumbRelative);
                if (Files.exists(thumbPath)) {
                    Files.delete(thumbPath);
                    log.info("🗑️ Deleted thumbnail: {}", thumbPath);
                }
            }
        } catch (IOException e) {
            log.error("❌ Failed to delete file: {}", relativePath, e);
        }
    }

    // ========== Helper Methods ==========

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("업로드된 이미지가 없습니다.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("이미지 파일만 업로드 가능합니다.");
        }

        if (file.getSize() > 10 * 1024 * 1024) {
            throw new IllegalArgumentException("파일 크기는 10MB 이하만 허용됩니다.");
        }

        String extension = getFileExtension(file.getOriginalFilename()).toLowerCase();
        if (!extension.matches("\\.(jpg|jpeg|jfif|png|gif|webp|bmp|tiff|tif)")) {
            throw new IllegalArgumentException("지원하지 않는 이미지 파일 형식입니다. (jpg, jpeg, jfif, png, gif, webp, bmp, tiff만 지원)");
        }
    }

    private String getFileExtension(String filename) {
        if (filename == null) {
            return "";
        }
        int lastDot = filename.lastIndexOf(".");
        return lastDot >= 0 ? filename.substring(lastDot) : "";
    }

    private String generateFilename(boolean isMain, String extension) {
        if (isMain) {
            return "main" + extension;
        } else {
            return "sub_" + UUID.randomUUID().toString().replace("-", "").substring(0, 8) + extension;
        }
    }

    private Path getProductFolder(String folder) {
        return baseDirectoryPath.resolve(Paths.get(productDir, folder)).normalize();
    }

    private Path getProfileFolder(String folder) {
        // 프로필 기본 경로(profileBaseDir) 하위에 사용자 폴더만 붙인다.
        return profileBaseDirectoryPath.resolve(folder).normalize();
    }

    private Path getAbsolutePath(String relativePath) {
        return baseDirectoryPath.resolve(relativePath).normalize();
    }

    private void optimizeImageFile(Path originalPath) {
        try {
            if (!Files.exists(originalPath)) {
                return;
            }
            Path tempFile = Files.createTempFile("opt_", getFileExtension(originalPath.getFileName().toString()));
            Thumbnails.of(originalPath.toFile())
                    .size(OPTIMIZE_MAX_WIDTH, OPTIMIZE_MAX_HEIGHT)
                    .outputQuality(OPTIMIZE_QUALITY)
                    .toFile(tempFile.toFile());
            Files.move(tempFile, originalPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (Exception e) {
            log.warn("⚠️ Failed to optimize image {}: {}", originalPath, e.getMessage());
        }
    }

    private void createThumbnailFile(Path originalPath) {
        try {
            if (!Files.exists(originalPath)) {
                return;
            }
            String thumbnailName = buildThumbnailFileName(originalPath.getFileName().toString());
            Path thumbnailPath = originalPath.getParent().resolve(thumbnailName);
            Thumbnails.of(originalPath.toFile())
                    .crop(Positions.CENTER)
                    .size(THUMBNAIL_SIZE, THUMBNAIL_SIZE)
                    .outputQuality(OPTIMIZE_QUALITY)
                    .toFile(thumbnailPath.toFile());
        } catch (Exception e) {
            log.warn("⚠️ Failed to create thumbnail for {}: {}", originalPath, e.getMessage());
        }
    }

    private void moveThumbnailIfExists(String tempRelativePath, Long productId, String newFilename) throws IOException {
        String tempThumbPath = buildThumbnailPath(tempRelativePath);
        if (tempThumbPath == null) {
            return;
        }
        Path sourceThumb = getAbsolutePath(tempThumbPath);
        if (!Files.exists(sourceThumb)) {
            return;
        }

        Path targetFolder = getProductFolder(String.valueOf(productId));
        Files.createDirectories(targetFolder);
        Path targetThumb = targetFolder.resolve(buildThumbnailFileName(newFilename));
        Files.move(sourceThumb, targetThumb, StandardCopyOption.REPLACE_EXISTING);
    }

    public String buildThumbnailPath(String relativePath) {
        if (relativePath == null || relativePath.isBlank()) {
            return null;
        }
        int idx = relativePath.lastIndexOf("/");
        String dir = idx >= 0 ? relativePath.substring(0, idx + 1) : "";
        String fileName = idx >= 0 ? relativePath.substring(idx + 1) : relativePath;
        return (dir + buildThumbnailFileName(fileName)).replace("\\", "/");
    }

    private String buildThumbnailFileName(String originalFileName) {
        return "thumb_" + originalFileName;
    }

    public boolean thumbnailExists(String relativePath) {
        String thumb = buildThumbnailPath(relativePath);
        if (thumb == null) return false;
        return Files.exists(getAbsolutePath(thumb));
    }
}
