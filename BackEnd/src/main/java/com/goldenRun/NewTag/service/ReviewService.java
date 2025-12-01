package com.goldenRun.NewTag.service;

import com.goldenRun.NewTag.Repository.ReviewRepository;
import com.goldenRun.NewTag.Repository.TransactionRepository;
import com.goldenRun.NewTag.Repository.UserRepository;
import com.goldenRun.NewTag.dto.ReviewDtos;
import com.goldenRun.NewTag.entity.Review;
import com.goldenRun.NewTag.entity.Transaction;
import com.goldenRun.NewTag.entity.User;
import com.goldenRun.NewTag.enums.TransactionStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    /**
     * 특정 사용자가 받은 리뷰 목록 조회
     */
    public Page<ReviewDtos.SimpleResponse> getReviewsByTarget(Long targetId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Review> reviews = reviewRepository.findByTargetIdOrderByCreatedAtDesc(targetId, pageable);
        return reviews.map(this::convertToSimpleResponse);
    }

    /**
     * 특정 사용자의 평점 요약 정보 조회
     */
    public ReviewDtos.RatingSummary getRatingSummary(Long targetId) {
        List<Review> reviews = reviewRepository.findByTargetId(targetId);

        if (reviews.isEmpty()) {
            return ReviewDtos.RatingSummary.builder()
                    .averageRating(0.0)
                    .totalCount(0L)
                    .rating5Count(0L)
                    .rating4Count(0L)
                    .rating3Count(0L)
                    .rating2Count(0L)
                    .rating1Count(0L)
                    .build();
        }

        Map<Integer, Long> ratingCounts = new HashMap<>();
        for (int i = 1; i <= 5; i++) {
            ratingCounts.put(i, 0L);
        }

        for (Review review : reviews) {
            Integer rating = review.getRating();
            if (rating != null && rating >= 1 && rating <= 5) {
                ratingCounts.put(rating, ratingCounts.get(rating) + 1);
            }
        }

        Double averageRating = reviewRepository.calculateAverageRating(targetId);
        if (averageRating == null) {
            averageRating = 0.0;
        }

        return ReviewDtos.RatingSummary.builder()
                .averageRating(Math.round(averageRating * 10) / 10.0)
                .totalCount((long) reviews.size())
                .rating5Count(ratingCounts.get(5))
                .rating4Count(ratingCounts.get(4))
                .rating3Count(ratingCounts.get(3))
                .rating2Count(ratingCounts.get(2))
                .rating1Count(ratingCounts.get(1))
                .build();
    }

    /**
     * 특정 사용자의 평균 평점 조회
     */
    public Double getAverageRating(Long targetId) {
        Double avg = reviewRepository.calculateAverageRating(targetId);
        if (avg == null) {
            return 0.0;
        }
        return Math.round(avg * 10) / 10.0;
    }

    /**
     * 특정 사용자의 리뷰 개수 조회
     */
    public Long getReviewCount(Long targetId) {
        return reviewRepository.countByTargetId(targetId);
    }

    /**
     * 해당 거래에 대해 현재 사용자가 이미 리뷰를 작성했는지 확인
     */
    public boolean hasReview(Long transactionId, String currentUserNick) {
        if (!StringUtils.hasText(currentUserNick)) {
            throw new AccessDeniedException("로그인이 필요합니다.");
        }
        if (transactionId == null) {
            throw new IllegalArgumentException("거래 정보가 필요합니다.");
        }

        User writer = userRepository.findByNick(currentUserNick);
        if (writer == null) {
            throw new AccessDeniedException("사용자 정보를 찾을 수 없습니다.");
        }

        return reviewRepository.existsByTransactionIdAndWriterId(transactionId, writer.getId());
    }

    /**
     * 리뷰 생성
     */
    @Transactional
    public ReviewDtos.Response createReview(ReviewDtos.CreateRequest request, String currentUserNick) {
        if (!StringUtils.hasText(currentUserNick)) {
            throw new AccessDeniedException("인증 정보가 필요합니다.");
        }
        if (request.getTransactionId() == null) {
            throw new IllegalArgumentException("거래 정보가 필요합니다.");
        }
        if (request.getRating() == null || request.getRating() < 1 || request.getRating() > 5) {
            throw new IllegalArgumentException("별점은 1~5 사이여야 합니다.");
        }

        User writer = userRepository.findByNick(currentUserNick);
        if (writer == null) {
            throw new AccessDeniedException("사용자 정보를 찾을 수 없습니다.");
        }

        Transaction transaction = transactionRepository.findById(request.getTransactionId())
                .orElseThrow(() -> new IllegalArgumentException("거래를 찾을 수 없습니다."));

        if (!transaction.getBuyer().getId().equals(writer.getId())) {
            throw new AccessDeniedException("구매자만 리뷰를 작성할 수 있습니다.");
        }

        if (transaction.getStatus() != TransactionStatus.COMPLETED) {
            throw new IllegalStateException("거래가 완료된 이후에만 리뷰를 작성할 수 있습니다.");
        }

        if (reviewRepository.existsByTransactionIdAndWriterId(transaction.getId(), writer.getId())) {
            throw new IllegalStateException("이미 이 거래에 대한 리뷰를 작성했습니다.");
        }

        User target = transaction.getSeller();
        if (request.getTargetId() != null && !request.getTargetId().equals(target.getId())) {
            throw new IllegalArgumentException("리뷰 대상이 거래 정보와 일치하지 않습니다.");
        }

        Review review = Review.builder()
                .transaction(transaction)
                .writer(writer)
                .target(target)
                .rating(request.getRating())
                .content(request.getContent())
                .build();

        Review saved = reviewRepository.save(review);
        return convertToResponse(saved);
    }

    private ReviewDtos.SimpleResponse convertToSimpleResponse(Review review) {
        return ReviewDtos.SimpleResponse.builder()
                .id(review.getId())
                .rating(review.getRating())
                .content(review.getContent())
                .createdAt(review.getCreatedAt())
                .writerName(review.getWriter().getName())
                .writerNick(review.getWriter().getNick())
                .writerProfileImg(review.getWriter().getProfileImg())
                .build();
    }

    private ReviewDtos.Response convertToResponse(Review review) {
        Transaction transaction = review.getTransaction();
        return ReviewDtos.Response.builder()
                .id(review.getId())
                .rating(review.getRating())
                .content(review.getContent())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .writerId(review.getWriter().getId())
                .writerName(review.getWriter().getName())
                .writerNick(review.getWriter().getNick())
                .writerProfileImg(review.getWriter().getProfileImg())
                .targetId(review.getTarget().getId())
                .targetName(review.getTarget().getName())
                .targetNick(review.getTarget().getNick())
                .transactionId(transaction != null ? transaction.getId() : null)
                .productTitle(transaction != null && transaction.getProduct() != null ? transaction.getProduct().getTitle() : null)
                .build();
    }

    /**
     * 사용자 등급 계산 (평점 기반)
     */
    public String calculateUserGrade(Long userId) {
        Double avgRating = getAverageRating(userId);
        Long reviewCount = getReviewCount(userId);

        if (reviewCount == 0) {
            return "초보";
        }

        if (reviewCount >= 50 && avgRating >= 4.8) {
            return "VIP";
        } else if (reviewCount >= 30 && avgRating >= 4.5) {
            return "Gold";
        } else if (reviewCount >= 10 && avgRating >= 4.0) {
            return "Silver";
        } else if (avgRating >= 3.5) {
            return "Bronze";
        } else {
            return "일반";
        }
    }
}
