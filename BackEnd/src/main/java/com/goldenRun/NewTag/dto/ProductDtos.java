package com.goldenRun.NewTag.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.goldenRun.NewTag.enums.ProductStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

public class ProductDtos {

    // =========================================================================
    // 상품 생성 요청 DTO
    // =========================================================================
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

        // 이미지 파일 목록 (첫 번째 항목을 isMain=true로 설정)
        private List<ImageItem> images;
    }

    // =========================================================================
    // 상품 수정 요청 DTO
    // =========================================================================
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

        // 전체 이미지 수정 (기존 삭제 + 새로운 리스트)
        private List<ImageItem> images;
    }

    // =========================================================================
    // 이미지 항목 DTO
    // =========================================================================
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ImageItem {
        private String path;      // 이미지 URL 또는 경로
        private Boolean isMain;   // 대표 이미지 여부
    }

    // =========================================================================
    // 상품 리스트 아이템 DTO
    // =========================================================================
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ListItem {
        private Integer id;
        private String mainImage;
        private String thumbnailImage;
        private String title;
        private Double price;
        private String locationNm;
        private LocalDateTime createdAt;
        private Integer viewCount;
        private Long favoriteCount;
        private String timeAgo;  // 예: “1시간 전”
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

    // =========================================================================
    // 상품 상세 조회 응답 DTO
    // =========================================================================
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

        private List<ImageResponse> images;  // 전체 이미지 목록
        private String mainImage;

        // 판매자 정보
        private Integer sellerId;
        private String sellerName;
        private String sellerNick;
        private String sellerProfileImg;
        private double sellerRatingAvg;
        private long sellerRatingCount;
        private String sellerGrade;
        private boolean likedByMe;
        private Boolean isResell;
    }

    // =========================================================================
    // 이미지 상세 응답 DTO
    // =========================================================================
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ImageResponse {
        private Integer id;

        @JsonProperty("pImg")  // 프론트에서 사용 중인 필드명
        private String pImg;

        private Boolean isMain;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private Integer productId;
        private String thumbnailPath;
    }

    // =========================================================================
    // 상품 상태 변경 요청
    // =========================================================================
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class StatusUpdateRequest {
        private ProductStatus status;
    }

    // =========================================================================
    // 거래 완료 요청
    // =========================================================================
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class CompleteSaleRequest {
        private Long buyerId;
    }

    // =========================================================================
    // 거래 완료 응답
    // =========================================================================
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CompleteSaleResponse {
        private DetailResponse product;
        private Long transactionId;
    }

<<<<<<< HEAD
    // =========================================================================
    // 상품 후기 작성 요청 DTO
    // =========================================================================
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ReviewRequest {
        private Double rating;    // 1.0 ~ 5.0
        private String content;   // 후기 내용
    }
}
=======

>>>>>>> origin
