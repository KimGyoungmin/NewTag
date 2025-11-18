package com.goldenRun.NewTag.dto;

import com.goldenRun.NewTag.enums.ProductStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO set dedicated to 게시글(=Product) 작성/삭제 요청에 사용된다.
 * ProductDtos를 수정하지 않기 위해 별도 파일로 정의하였다.
 */
public class PostDtos {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateRequest {
        private String title;
        private String content;
        private Double price;
        private Long categoryId;
        private String locationNm;
        private Double latitude;
        private Double longitude;
        private List<ImageRequest> images;
        private Boolean isResell;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ImageRequest {
        private String path;
        private Boolean isMain;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SimpleResponse {
        private Long id;
        private String title;
        private BigDecimal price;
        private ProductStatus status;
        private String mainImage;
        private LocalDateTime createdAt;
        private Boolean isResell;
    }
}
