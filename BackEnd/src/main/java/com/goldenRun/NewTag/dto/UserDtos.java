package com.goldenRun.NewTag.dto;

import com.goldenRun.NewTag.enums.TransactionStatus;
import com.goldenRun.NewTag.enums.UserGrade;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class UserDtos {

    
    // 1. 프로필 업데이트 DTO 
    
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ProfileUpdateRequest {
        private String nickName;
        private String profileImageUrl; 
    }

    
    // 마이페이지 응답 DTO 
    
    @Getter @Builder
    public static class MyPageResponse {
        private String nickName;
        private String profileImageUrl;
        private UserGrade grade; 
        private double rating; 
        private double mannerTemperature; 
        
       
        private Long soldCount;
        private Long totalRevenue;
        private Double avgViews;
    }

   
    //  거래 히스토리 응답 DTO (월별/연도별)
    
    @Getter @Builder
    public static class TransactionHistoryResponse {
        
        private Map<Integer, Map<Integer, Long>> monthlyHistory; 
        private List<TransactionItem> transactions; 
    }

    @Getter @Builder
    public static class TransactionItem {
    	private Long transactionId; 
        private String title;
        private Double price;
        private LocalDateTime transactionDate;
        private TransactionStatus status;
        private String partnerNick;
        private boolean isBuyer;
    }

    
    //  거래 후기 DTO (후기 보기)
    
    @Getter @Builder
    public static class ReviewItem {
        private Integer reviewId;
        private String content;
        private String reviewerNick;
        private LocalDateTime createdAt;
        private double ratingScore;
    }

    
    // 차단/신고 목록 DTO
    
    @Getter @Builder
    public static class UserListItem {
        private Long userId;
        private String nickName;
        private LocalDateTime blockedAt; 
        private LocalDateTime reportedAt; 
    }
}