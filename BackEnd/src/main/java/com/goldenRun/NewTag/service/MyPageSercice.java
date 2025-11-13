package com.goldenRun.NewTag.service;

import com.goldenRun.NewTag.Repository.*;
import com.goldenRun.NewTag.dto.UserDtos;
import com.goldenRun.NewTag.dto.UserDtos.*;
import com.goldenRun.NewTag.entity.*;
import com.goldenRun.NewTag.enums.ProductStatus;
import com.goldenRun.NewTag.enums.TransactionStatus;
import com.goldenRun.NewTag.enums.UserGrade;


import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class MyPageSercice {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ReviewRepository reviewRepository;
    private final BlockRepository blockRepository; 
    private final ReportRepository reportRepository; 
    private final TransactionRepository transactionRepository; 

   
    private String getCurrentUserNick() {
        return SecurityContextHolder.getContext().getAuthentication().getName(); 
    }
    
    
    @Transactional
    public User updateProfile(ProfileUpdateRequest request) {
        String nick = getCurrentUserNick();
        User user = userRepository.findByNick(nick)
                .orElseThrow(() -> new NoSuchElementException("인증된 사용자 정보를 찾을 수 없습니다."));

        if (request.getNickName() != null && !request.getNickName().isEmpty()) {
            user.setNick(request.getNickName()); // 닉네임 업데이트
        }
        
        if (request.getProfileImageUrl() != null) {
            user.setProfileImg(request.getProfileImageUrl()); // 프로필 이미지 URL 업데이트
        }
        
        return userRepository.save(user); // 변경 내용 저장
    }

    //  마이페이지 데이터 조회
    @Transactional(readOnly = true)
    public MyPageResponse getMyPageData() {
        String nick = getCurrentUserNick();
        User currentUser = userRepository.findByNick(nick)
                .orElseThrow(() -> new NoSuchElementException("인증된 사용자 정보를 찾을 수 없습니다."));
                
        //  DB 조회 필요: 매너 온도(평점), 통계 데이터
        // 이 데이터들은 User 엔티티에 직접 저장되거나, Product/Review 테이블에서 집계되어야 합니다.
        
        
        Long soldCount = productRepository.countBySellerAndStatus(currentUser, ProductStatus.SOLD_OUT); 
        Long totalRevenue = productRepository.sumRevenueBySeller(currentUser); 
        Double avgViews = productRepository.findAvgViewsBySeller(currentUser); 
        
        return MyPageResponse.builder()
                .nickName(currentUser.getNick())
                .profileImageUrl(currentUser.getProfileImg())
                .grade(currentUser.getGrade() != null ? currentUser.getGrade() : UserGrade.BRONZE)
                .mannerTemperature(currentUser.getTrust()) 
                .soldCount(soldCount != null ? soldCount : 0L)
                .totalRevenue(totalRevenue != null ? totalRevenue : 0L)
                .avgViews(avgViews != null ? avgViews : 0.0)
                .build();
    }
    
    // ---  거래 후기 조회 (내가 받은 후기) ---
    @Transactional(readOnly = true)
    public List<ReviewItem> getReceivedReviews() {
        String nick = getCurrentUserNick();
        User targetUser = userRepository.findByNick(nick)
                .orElseThrow(() -> new NoSuchElementException("사용자 정보를 찾을 수 없습니다."));
        
        //  해당 사용자가 받은 모든 후기 조회
        List<Review> reviews = reviewRepository.findByTargetUser(targetUser); 
        
        return reviews.stream()
                .map(this::convertToReviewItem)
                .collect(Collectors.toList());
    }

    //  판매 내역 조회
    @Transactional(readOnly = true)
    public List<Product> getMySoldProducts() {
        String nick = getCurrentUserNick();
        User seller = userRepository.findByNick(nick)
                .orElseThrow(() -> new NoSuchElementException("사용자 정보를 찾을 수 없습니다."));

        // 내가 판매했고 삭제되지 않은 상품 전체 조회
        return productRepository.findBySellerAndIsDeleteFalse(seller);
    }

    // --- 5. 거래 히스토리 상세 (월별, 연도별) ---
    @Transactional(readOnly = true)
    public TransactionHistoryResponse getTransactionHistory() {
        String nick = getCurrentUserNick();
        User user = userRepository.findByNick(nick)
                .orElseThrow(() -> new NoSuchElementException("사용자 정보를 찾을 수 없습니다."));

        // 🚨 DB 조회: 해당 사용자의 모든 거래 기록 조회 (Transaction 엔티티 가정)
        List<Transaction> allTransactions = transactionRepository.findByBuyerOrSeller(user, user);
        
        // 1. 월별/연도별 통계 계산
        Map<Integer, Map<Integer, Long>> monthlyHistory = allTransactions.stream()
            .collect(Collectors.groupingBy(
                t -> t.getCreatedAt().getYear(), // 연도별 그룹핑
                Collectors.groupingBy(
                    t -> t.getCreatedAt().getMonthValue(), // 월별 그룹핑
                    Collectors.counting() // 개수 카운트
                )
            ));
            
        // 2. 최근 거래 10개 목록 변환
        List<TransactionItem> recentItems = allTransactions.stream()
            .sorted(Comparator.comparing(Transaction::getCreatedAt).reversed())
            .limit(10)
            .map(t -> convertToTransactionItem(t, user))
            .collect(Collectors.toList());
            
        return TransactionHistoryResponse.builder()
            .monthlyHistory(monthlyHistory)
            .transactions(recentItems)
            .build();
    }

    // --- 6. 차단 사용자 관리 (목록 조회) ---
    @Transactional(readOnly = true)
    public List<UserListItem> getBlockedUsers() {
        String nick = getCurrentUserNick();
        User currentUser = userRepository.findByNick(nick)
                .orElseThrow(() -> new NoSuchElementException("사용자 정보를 찾을 수 없습니다."));

        List<Block> blocks = blockRepository.findByBlockerUser(currentUser); 

     
        return blocks.stream()
        	    
        	    .map((Block block) -> UserListItem.builder() 
        	        .userId(block.getBlockedUser().getId())
        	        .nickName(block.getBlockedUser().getNick())
        	        .blockedAt(block.getCreatedAt()) 
        	        .build())
        	    .collect(Collectors.toList());
    }

    //  신고 내역 (내가 신고한 내역 목록)
    @Transactional(readOnly = true)
    public List<UserListItem> getMyReportHistory() {
        String nick = getCurrentUserNick();
        User currentUser = userRepository.findByNick(nick)
                .orElseThrow(() -> new NoSuchElementException("사용자 정보를 찾을 수 없습니다."));

        //  DB 조회: 내가 신고한 내역 목록 조회 (Report 엔티티 가정)
        List<Report> reports = reportRepository.findByReporterUser(currentUser);

        return reports.stream()
            .map(report -> UserListItem.builder()
                .userId(report.getTargetUser().getId()) // 신고 대상 사용자 ID
                .nickName(report.getTargetUser().getNick()) // 신고 대상 사용자 닉네임
                .reportedAt(report.getCreatedAt()) 
                .build())
            .collect(Collectors.toList());
    }
    
    // --- DTO 변환 유틸리티 ---
    private UserDtos.ReviewItem convertToReviewItem(Review review) {
        return UserDtos.ReviewItem.builder()
            .reviewId(review.getId())
            .content(review.getContent())
            // 작성자 User 객체에서 닉네임을 가져옵니다.
            .reviewerNick(review.getWriter().getNick()) 
            .createdAt(review.getCreatedAt())
            //  필드의 Integer 값을 Double 타입 DTO 필드에 매핑합니다.
            .ratingScore(review.getRating().doubleValue()) 
            .build();
    }
    
    private UserDtos.TransactionItem convertToTransactionItem(Transaction transaction, User currentUser) {
        // 1. 상대방 (partner) 결정
        // User 객체의 동등성 비교는 ID로 하는 것이 안전합니다.
        User partner = transaction.getBuyer().getId().equals(currentUser.getId()) 
                       ? transaction.getSeller() 
                       : transaction.getBuyer();
        
        // 2. 현재 사용자가 구매자인지 판매자인지 판단
        boolean isBuyer = transaction.getBuyer().getId().equals(currentUser.getId()); 
        
        // 3. 🚨 TransactionStatus는 엔티티의 실제 상태를 사용
        TransactionStatus transactionStatus = transaction.getStatus();

        return UserDtos.TransactionItem.builder()
            .transactionId(transaction.getId()) 
            .title(transaction.getProduct().getTitle())
            .price(transaction.getProduct().getPrice())  
            .transactionDate(transaction.getCreatedAt())
            .status(transactionStatus) 
            .partnerNick(partner.getNick())
            .isBuyer(isBuyer) // 💡 DTO에 isBuyer 필드가 필요합니다.
            .build();
    }
}