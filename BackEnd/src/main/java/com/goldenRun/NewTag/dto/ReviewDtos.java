package com.goldenRun.NewTag.dto;

import lombok.*;

import java.time.LocalDateTime;

public class ReviewDtos {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CreateRequest {
        private Long transactionId;
        private Long targetId; // 리뷰 대상자 (판매자 또는 구매자)
        private Integer rating; // 1-5점
        private String content; // 리뷰 내용
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class UpdateRequest {
        private Integer rating;
        private String content;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Response {
        private Long id;
        private Integer rating;
        private String content;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        // 작성자 정보
        private Long writerId;
        private String writerName;
        private String writerNick;
        private String writerProfileImg;

        // 대상자 정보
        private Long targetId;
        private String targetName;
        private String targetNick;

        // 거래 정보
        private Long transactionId;
        private String productTitle; // 거래한 상품명
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class RatingSummary {
        private Double averageRating; // 평균 평점
        private Long totalCount; // 총 리뷰 개수
        private Long rating5Count; // 5점 개수
        private Long rating4Count; // 4점 개수
        private Long rating3Count; // 3점 개수
        private Long rating2Count; // 2점 개수
        private Long rating1Count; // 1점 개수
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class SimpleResponse {
        private Long id;
        private Integer rating;
        private String content;
        private LocalDateTime createdAt;
        private String writerName;
        private String writerNick;
        private String writerProfileImg;
    }
}
