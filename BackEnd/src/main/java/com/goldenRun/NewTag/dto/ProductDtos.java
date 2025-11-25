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
        private Boolean isResell;
        private List<ImageItem> images; // ?뚯씪紐?URL 紐⑸줉 (泥?踰덉㎏瑜?isMain?쇰줈 吏??
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
        private String thumbnailImage;
        private String title;
        private Double price;
        private String locationNm;
        private Double latitude;
        private Double longitude;
        private LocalDateTime createdAt;
        private Integer viewCount;
        private Long favoriteCount;
        private String timeAgo; // "1시간 전" 같은 문자열
        private Boolean isResell;
        // 판매자 정보 추가 (찜하기 버튼 표시 여부 판단용)
        private SellerInfo seller;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class SellerInfo {
        private Integer id;
        private String nick;
        private String name;
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
        private Boolean isResell;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ImageResponse {
        private Integer id;
        @JsonProperty("pImg")
        private String pImg;  // ?꾨줎?몄뿏?쒖뿉??pImg濡??묎렐
        private Boolean isMain;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private Integer productId;
        private String thumbnailPath;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class StatusUpdateRequest {
        private ProductStatus status;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CompleteSaleRequest {
        private Long buyerId;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CompleteSaleResponse {
        private DetailResponse product;
        private Long transactionId;
    }

    // DTO Projection 인터페이스 (N+1 최적화)
    public interface ProductListProjection {
        Long getId();
        String getTitle();
        Double getPrice();
        String getLocationNm();
        Double getLatitude();
        Double getLongitude();
        LocalDateTime getCreatedAt();
        Integer getViewCount();
        Boolean getIsResell();

        // Seller 정보
        Long getSellerId();
        String getSellerNick();
        String getSellerName();

        // Category 정보
        Long getCategoryId();
        String getCategoryName();

        // Main Image 정보
        String getMainImagePath();
    }
}


