package com.goldenRun.NewTag.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // /api/v1/static/** 경로로 들어오는 요청을 static/ 폴더에서 찾음
        registry.addResourceHandler("/api/v1/static/**")
                .addResourceLocations("classpath:/static/", "file:static/")
                .setCachePeriod(3600); // 1시간 캐싱
    }
}
