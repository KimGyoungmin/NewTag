package com.goldenRun.NewTag.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${app.upload.base-dir:BackEnd/src/main/resources/static}")
    private String uploadBaseDir;

    @Value("${app.upload.profile-base-dir:BackEnd/src/main/resources/userprofile}")
    private String profileBaseDir;

    @Value("${app.upload.profile-dir:userprofile}")
    private String profileDir;

    private static final Logger log = LoggerFactory.getLogger(WebMvcConfig.class);

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadPath = Paths.get(uploadBaseDir).toAbsolutePath().normalize();
        String fileLocation = uploadPath.toUri().toString();

        registry.addResourceHandler("/api/v1/static/**")
                .addResourceLocations(fileLocation, "classpath:/static/")
                .setCachePeriod(3600);

        log.info("Static resources configured: /api/v1/static/** -> {}, classpath:/static/", fileLocation);

        Path profilePath = Paths.get(profileBaseDir).toAbsolutePath().normalize();
        String profileLocation = profilePath.toUri().toString();
        String profilePattern = "/api/v1/" + profileDir + "/**";

        registry.addResourceHandler(profilePattern)
                .addResourceLocations(profileLocation)
                .setCachePeriod(3600);

        log.info("Profile resources configured: {} -> {}", profilePattern, profileLocation);
    }
}
