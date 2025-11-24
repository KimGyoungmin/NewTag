package com.goldenRun.NewTag.dto;

import com.goldenRun.NewTag.entity.Category;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class CategoryDto {

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private String categoryNm;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public static Response from(Category category) {
            return Response.builder()
                    .id(category.getId())
                    .categoryNm(category.getCategoryNm())
                    .createdAt(category.getCreatedAt())
                    .updatedAt(category.getUpdatedAt())
                    .build();
        }
    }
}
