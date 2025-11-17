package com.goldenRun.NewTag.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.goldenRun.NewTag.enums.ProductStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

public class ProductDtos {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CreateRequest {
        private Double price;
        private String title;
        private String content;
        private Integer categoryId;
        private String locationNm;
        private Double latitude;
        private Double longitude;
        private Integer sellerId;
        private List<ImageItem> images; // 파일명/URL 목록 (첫 번째를 isMain으로 지정)
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class UpdateRequest {
        private Double price;
        private String title;
        private String content;
        private ProductStatus status;
        private String locationNm;
        private Double latitude;
        private Double longitude;
        private Integer categoryId;
        private List<ImageItem> images;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ImageItem {
        private String path;
        private Boolean isMain;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ListItem {
        private Integer id;
        private String mainImage;
        private String title;
        private Double price;
        private String locationNm;
        private LocalDateTime createdAt;
        private Integer viewCount;
        private Long favoriteCount;
        private String timeAgo; // "1시간 전" 같은 문자열
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class DetailResponse {
        private Integer id;
        private String title;
        private Double price;
        private String content;
        private ProductStatus status;
        private String locationNm;
        private Double latitude;
        private Double longitude;
        private Integer viewCount;
        private Long favoriteCount;
        private String timeAgo;
        private LocalDateTime createdAt;
        private Integer categoryId;

        private List<ImageResponse> images; // 모든 이미지(메인 우선 정렬)
        private String mainImage;

        // 판매자 박스
        private Integer sellerId;
        private String sellerName;
        private String sellerNick;
        private String sellerProfileImg;
        private double sellerRatingAvg;
        private long sellerRatingCount;
        private String sellerGrade; // 예: Gold/Silver 등
        private boolean likedByMe;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ImageResponse {
        private Integer id;
        @JsonProperty("pImg")
        private String pImg;  // 프론트엔드에서 pImg로 접근
        private Boolean isMain;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private Integer productId;
    }
}