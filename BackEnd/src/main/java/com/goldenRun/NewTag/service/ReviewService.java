package com.goldenRun.NewTag.service;

import com.goldenRun.NewTag.Repository.ReviewRepository;
import com.goldenRun.NewTag.dto.ReviewDtos;
import com.goldenRun.NewTag.entity.Review;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReviewService {

    private final ReviewRepository reviewRepository;

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

        // 평점별 개수 계산
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

        // 평균 평점 계산
        Double averageRating = reviewRepository.calculateAverageRating(targetId);
        if (averageRating == null) {
            averageRating = 0.0;
        }

        return ReviewDtos.RatingSummary.builder()
                .averageRating(Math.round(averageRating * 10) / 10.0) // 소수점 첫째자리까지
                .totalCount((long) reviews.size())
                .rating5Count(ratingCounts.get(5))
                .rating4Count(ratingCounts.get(4))
                .rating3Count(ratingCounts.get(3))
                .rating2Count(ratingCounts.get(2))
                .rating1Count(ratingCounts.get(1))
                .build();
    }

    /**
     * 사용자의 평균 평점만 조회 (ProductService에서 사용)
     */
    public Double getAverageRating(Long targetId) {
        Double avg = reviewRepository.calculateAverageRating(targetId);
        if (avg == null) {
            return 0.0;
        }
        return Math.round(avg * 10) / 10.0; // 소수점 첫째자리까지
    }

    /**
     * 사용자의 리뷰 개수 조회 (ProductService에서 사용)
     */
    public Long getReviewCount(Long targetId) {
        return reviewRepository.countByTargetId(targetId);
    }

    /**
     * Review -> SimpleResponse 변환
     */
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

    /**
     * 사용자 등급 계산 (평점 기반)
     */
    public String calculateUserGrade(Long userId) {
        Double avgRating = getAverageRating(userId);
        Long reviewCount = getReviewCount(userId);

        // 리뷰가 없는 경우
        if (reviewCount == 0) {
            return "새내기";
        }

        // 리뷰 수와 평점에 따른 등급 결정
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
