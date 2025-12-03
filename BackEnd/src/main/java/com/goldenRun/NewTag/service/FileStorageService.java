package com.goldenRun.NewTag.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.CopyObjectRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.ObjectCannedACL;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class FileStorageService {

    private final S3Client s3Client;

    @Value("${aws.s3.bucket-name}")
    private String bucketName;

    @Value("${aws.s3.endpoint}")
    private String endpoint;

    @Value("${app.upload.product-dir:products}")
    private String productDir;

    @Value("${app.upload.profile-dir:userprofile}")
    private String profileDir;

    public String store(MultipartFile file) {
        return storeProductImage(file, null, false);
    }

    public String storeProductImage(MultipartFile file, Long productId, boolean isMain) {
        validateFile(file);

        String extension = getFileExtension(file.getOriginalFilename());
        String filename = generateFilename(isMain, extension);
        String folder = (productId != null) ? String.valueOf(productId) : "temp";
        String s3Key = productDir + "/" + folder + "/" + filename;

        try {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .acl(ObjectCannedACL.PUBLIC_READ)
                    .contentType(file.getContentType())
                    .build();

            s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

            String fileUrl = endpoint + "/" + bucketName + "/" + s3Key;
            log.info("✅ Uploaded product image to S3: {}", fileUrl);
            return fileUrl;

        } catch (IOException e) {
            log.error("❌ Failed to upload image to S3", e);
            throw new RuntimeException("S3 이미지 업로드에 실패했습니다: " + e.getMessage());
        }
    }

    public String storeProfileImage(MultipartFile file, String folderName) {
        validateFile(file);

        String extension = getFileExtension(file.getOriginalFilename());
        String filename = "profile_" + UUID.randomUUID().toString().substring(0, 10) + extension;
        String folder = (folderName != null && !folderName.isBlank()) ? folderName : "temp";
        String s3Key = profileDir + "/" + folder + "/" + filename;

        try {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .acl(ObjectCannedACL.PUBLIC_READ)
                    .contentType(file.getContentType())
                    .build();

            s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

            String fileUrl = endpoint + "/" + bucketName + "/" + s3Key;
            log.info("✅ Uploaded profile image to S3: {}", fileUrl);
            return fileUrl;
        } catch (IOException e) {
            log.error("❌ Failed to upload profile image to S3", e);
            throw new RuntimeException("프로필 이미지 S3 업로드에 실패했습니다: " + e.getMessage());
        }
    }

    public String storeChatImage(MultipartFile file, String folder) {
        validateFile(file);

        String extension = getFileExtension(file.getOriginalFilename());
        String filename = "chat_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8) + extension;
        String s3Key = folder + "/" + filename;

        try {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .acl(ObjectCannedACL.PUBLIC_READ)
                    .contentType(file.getContentType())
                    .build();

            s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

            String fileUrl = endpoint + "/" + bucketName + "/" + s3Key;
            log.info("✅ Uploaded chat image to S3: {}", fileUrl);
            return fileUrl;
        } catch (IOException e) {
            log.error("❌ Failed to upload chat image to S3", e);
            throw new RuntimeException("채팅 이미지 S3 업로드에 실패했습니다: " + e.getMessage());
        }
    }

    public String moveToProductFolder(String tempUrl, Long productId, boolean isMain) {
        if (tempUrl == null || !tempUrl.contains("/" + productDir + "/temp/")) {
            return tempUrl;
        }

        try {
            String tempKey = tempUrl.substring(tempUrl.indexOf(productDir + "/temp/"));

            String extension = getFileExtension(tempKey);
            String newFilename = generateFilename(isMain, extension);
            String newKey = productDir + "/" + productId + "/" + newFilename;

            CopyObjectRequest copyReq = CopyObjectRequest.builder()
                .sourceBucket(bucketName)
                .sourceKey(tempKey)
                .destinationBucket(bucketName)
                .destinationKey(newKey)
                .acl(ObjectCannedACL.PUBLIC_READ)
                .build();

            s3Client.copyObject(copyReq);

            deleteFileByS3Key(tempKey);

            String newFileUrl = endpoint + "/" + bucketName + "/" + newKey;
            log.info("✅ Moved S3 object: {} -> {}", tempUrl, newFileUrl);
            return newFileUrl;

        } catch (Exception e) {
            log.error("❌ Failed to move S3 object", e);
            return tempUrl;
        }
    }

    public void deleteFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank() || !fileUrl.contains(bucketName)) {
            return;
        }
        try {
            String key = fileUrl.substring(fileUrl.indexOf(bucketName) + bucketName.length() + 1);
            deleteFileByS3Key(key);
        } catch (Exception e) {
            log.error("❌ Failed to parse and delete file from S3: {}", fileUrl, e);
        }
    }

    private void deleteFileByS3Key(String key) {
        try {
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .build();
            s3Client.deleteObject(deleteObjectRequest);
            log.info("🗑️ Deleted S3 object: {}", key);
        } catch (Exception e) {
            log.error("❌ Failed to delete S3 object: {}", key, e);
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("업로드된 이미지가 없습니다.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("이미지 파일만 업로드 가능합니다.");
        }
    }

    private String getFileExtension(String filename) {
        if (filename == null) return "";
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
}
