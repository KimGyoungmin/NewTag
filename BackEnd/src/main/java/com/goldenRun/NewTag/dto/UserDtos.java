package com.goldenRun.NewTag.dto;

import com.goldenRun.NewTag.entity.User;
import com.goldenRun.NewTag.enums.Provider;
import com.goldenRun.NewTag.enums.Role;
import com.goldenRun.NewTag.enums.TransactionStatus;
import com.goldenRun.NewTag.enums.UserGrade;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class UserDtos {

    // =========================================================================
    // 1. 기본 정보 응답 DTO (SimpleResponse)
    // =========================================================================
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SimpleResponse {
        private Long id;
        private String name;
        private String nick;
        private String email;
        private String phone;
        private LocalDate birth;
        private Provider provider;
        private String providerId;
        private boolean emailVerified;
        private boolean phoneVerified;
        private Role role;
        private boolean isDelete;
        private Double trust;
        private String profileImg;
        private LocalDateTime lastLoginAt;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public static SimpleResponse from(User user) {
            return SimpleResponse.builder()
                    .id(user.getId())
                    .name(user.getName())
                    .nick(user.getNick())
                    .email(user.getEmail())
                    .phone(user.getPhone())
                    .birth(user.getBirth())
                    .provider(user.getProvider())
                    .providerId(user.getProviderId())
                    .emailVerified(false)
                    .phoneVerified(false)
                    .role(user.getRole())
                    .isDelete(user.isDelete())
                    .trust((Double) user.getTrust())
                    .profileImg(user.getProfileImg())
                    .lastLoginAt(user.getLastLoginAt())
                    .createdAt(user.getCreatedAt())
                    .updatedAt(user.getUpdatedAt())
                    .build();
        }
        
    }

    // =========================================================================
    // 2. 프로필 업데이트 요청 DTO (ProfileUpdateRequest)
    // =========================================================================
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ProfileUpdateRequest {
        private String nickName;
        private String profileImageUrl;
        //private String location; // 필요시 추가
    }
    

    // =========================================================================
    // 3. 프로필 조회 응답 DTO (UserProfileData) - 프론트엔드 요구사항에 맞춤
    // =========================================================================
    @Getter @Builder
    @NoArgsConstructor @AllArgsConstructor // Builder 오류 방지
    public static class UserProfileData {
        private String id;
        private String name;
        private String nickname;     // name, nick 대신 nickname 사용
        private String profileImage; // image, profileImg 대신 profileImage 사용
        private String email;        // 프론트엔드 요구사항 추가
        private double rating;
        private int reviewCount;
        private String location;     // 사용자 위치
    }


    // =========================================================================
    // 4. 마이페이지 요약 응답 DTO (MyPageResponse)
    // =========================================================================
    @Getter @Builder
    public static class MyPageResponse {
        private String nickName;
        private String profileImageUrl;
        private UserGrade grade;
        private double rating;
        private double mannerTemperature;

        private Long soldCount;
        private BigDecimal totalRevenue;
        private Double avgViews;
    }


    // =========================================================================
    // 5. 거래 내역 아이템 DTO (PurchaseItem) - mypage.ts와 매핑
    // =========================================================================
    @Getter @Builder
    public static class PurchaseItem {
        private String id; // Product ID
        private String image; // Product Image URL
        private String title; // Product Title
        private Double price; // Product Price (Double)
        private String purchaseDate; // 거래 완료일 (YYYY-MM-DD)
    }


    // =========================================================================
    // 6. 거래 히스토리 상세 DTO (TransactionHistoryResponse, TransactionItem)
    // =========================================================================
    @Getter @Builder
    public static class TransactionHistoryResponse {
        private Map<Integer, Map<Integer, Long>> monthlyHistory;
        private List<TransactionItem> transactions;
    }

    @Getter @Builder
    public static class TransactionItem {
        private Long transactionId;
        private String title;
        private BigDecimal price; // 금융 데이터이므로 BigDecimal 유지
        private LocalDateTime transactionDate;
        private TransactionStatus status;
        private String partnerNick;
        private boolean isBuyer;
    }


    // =========================================================================
    // 7. 거래 후기 DTO (ReviewItem)
    // =========================================================================
@Getter
@Builder
public static class ReviewItem {
    private String id;              // review.getId().toString()
    private String reviewer;        // review.getWriter().getNick()
    private double rating;          // review.getRating().doubleValue()
    private String comment;         // review.getContent() (예상)
    private String reviewerImage;   // review.getWriter().getProfileImg() (예상)
    private String productTitle;    // review.getProduct().getTitle() (예상)
    private LocalDateTime date;     // review.getCreatedAt() (예상)
}



    
}