package com.goldenRun.NewTag.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@Slf4j
public class FileStorageService {

    @Value("${app.upload-dir:static/uploads}")
    private String uploadDir;

    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("업로드할 이미지가 없습니다.");
        }

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
        String extension = "";
        int extIndex = originalFilename.lastIndexOf(".");
        if (extIndex >= 0) {
            extension = originalFilename.substring(extIndex);
        }

        String filename = UUID.randomUUID().toString().replace("-", "") + extension;

        try {
            Path rootLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(rootLocation);

            Path targetLocation = rootLocation.resolve(filename);
            file.transferTo(targetLocation);

            String relativePath = "uploads/" + filename;
            log.info("Stored image file at {}", targetLocation);
            return relativePath.replace("\\", "/");
        } catch (IOException e) {
            throw new RuntimeException("이미지 업로드에 실패했습니다.", e);
        }
    }
}
