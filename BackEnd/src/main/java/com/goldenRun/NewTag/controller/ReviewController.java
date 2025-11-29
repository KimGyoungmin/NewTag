package com.goldenRun.NewTag.controller;

import com.goldenRun.NewTag.dto.ReviewDtos;
import com.goldenRun.NewTag.service.ReviewService;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/v1/reviews")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost","http://localhost:5173", "http://localhost:5174"}, allowCredentials = "true")
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    public ResponseEntity<ReviewDtos.Response> createReview(
            @Valid @RequestBody ReviewDtos.CreateRequest request,
            @AuthenticationPrincipal(expression = "username") String currentUserNick
    ) {
        ReviewDtos.Response response = reviewService.createReview(request, currentUserNick);
        return ResponseEntity.ok(response);
    }

    /**
     * 특정 사용자가 받은 리뷰 목록 조회
     * GET /api/v1/reviews/user/{userId}?page=0&size=10
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<Map<String, Object>> getUserReviews(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<ReviewDtos.SimpleResponse> reviews = reviewService.getReviewsByTarget(userId, page, size);

        Map<String, Object> response = new HashMap<>();
        response.put("reviews", reviews.getContent());
        response.put("currentPage", reviews.getNumber());
        response.put("totalPages", reviews.getTotalPages());
        response.put("totalElements", reviews.getTotalElements());
        response.put("hasNext", reviews.hasNext());

        return ResponseEntity.ok(response);
    }

    /**
     * 현재 사용자가 특정 거래에 대해 이미 리뷰를 작성했는지 확인
     * GET /api/v1/reviews/exists?transactionId=1
     */
    @GetMapping("/exists")
    public ResponseEntity<Map<String, Object>> existsReview(
            @RequestParam Long transactionId,
            @AuthenticationPrincipal(expression = "username") String currentUserNick
    ) {
        boolean exists = reviewService.hasReview(transactionId, currentUserNick);
        return ResponseEntity.ok(Map.of("exists", exists));
    }

    /**
     * 특정 사용자의 평점 요약 정보 조회
     * GET /api/v1/reviews/user/{userId}/summary
     */
    @GetMapping("/user/{userId}/summary")
    public ResponseEntity<ReviewDtos.RatingSummary> getRatingSummary(
            @PathVariable Long userId
    ) {
        ReviewDtos.RatingSummary summary = reviewService.getRatingSummary(userId);
        return ResponseEntity.ok(summary);
    }
}
