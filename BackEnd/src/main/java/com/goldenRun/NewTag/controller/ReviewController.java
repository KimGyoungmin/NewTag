package com.goldenRun.NewTag.controller;

import com.goldenRun.NewTag.dto.ReviewDtos;
import com.goldenRun.NewTag.service.ReviewService;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"}, allowCredentials = "true")
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    public ResponseEntity<ReviewDtos.Response> createReview(
            @Valid @RequestBody ReviewDtos.CreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        ReviewDtos.Response response = reviewService.createReview(request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    /**
     * ?뱀젙 ?ъ슜?먭? 諛쏆? 由щ럭 紐⑸줉 議고쉶
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
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        boolean exists = reviewService.hasReview(transactionId, userDetails.getUsername());
        return ResponseEntity.ok(Map.of("exists", exists));
    }

    /**
     * ?뱀젙 ?ъ슜?먯쓽 ?됱젏 ?붿빟 ?뺣낫 議고쉶
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

