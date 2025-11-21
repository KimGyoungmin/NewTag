package com.goldenRun.NewTag.dto;

import lombok.*;
import java.time.LocalDateTime;

public class ReviewDtos {

    /* ============================
       상세 리뷰 응답(Response)
       ============================ */
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private Double rating;
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
        private String productTitle;
    }

    /* Review → Response 변환 */
    public static Response from(Review r) {
        return Response.builder()
                .id(r.getId())
                .rating(r.getRating())
                .content(r.getContent())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())

                .writerId(r.getWriter().getId())
                .writerName(r.getWriter().getName())
                .writerNick(r.getWriter().getNick())
                .writerProfileImg(r.getWriter().getProfileImg())

                .targetId(r.getTarget().getId())
                .targetName(r.getTarget().getName())
                .targetNick(r.getTarget().getNick())

                .transactionId(r.getTransaction().getId())
                .productTitle(r.getTransaction().getProduct().getTitle())
                .build();
    }

    /* ============================
       간단 요약 리뷰 응답(SimpleResponse)
       ============================ */
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SimpleResponse {
        private Long id;
        private Double rating;
        private String content;
        private LocalDateTime createdAt;

        private String writerName;
        private String writerNick;
        private String writerProfileImg;
    }

    /* Review → SimpleResponse 변환 */
    public static SimpleResponse simpleFrom(Review r) {
        return SimpleResponse.builder()
                .id(r.getId())
                .rating(r.getRating())
                .content(r.getContent())
                .createdAt(r.getCreatedAt())

                .writerName(r.getWriter().getName())
                .writerNick(r.getWriter().getNick())
                .writerProfileImg(r.getWriter().getProfileImg())
                .build();
    }
}
