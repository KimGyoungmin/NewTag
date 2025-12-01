package com.goldenRun.NewTag.controller;

import com.goldenRun.NewTag.service.FavoriteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;

    /**
     * 찜하기 토글 (찜 추가/취소)
     * POST /api/v1/favorites/{productId}?userId=1
     */
    @PostMapping("/{productId}")
    public ResponseEntity<Map<String, Object>> toggleFavorite(
            @PathVariable Long productId,
            @RequestParam Long userId) {

        boolean isFavorited = favoriteService.toggleFavorite(productId, userId);
        long favoriteCount = favoriteService.getFavoriteCount(productId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("isFavorited", isFavorited);
        response.put("favoriteCount", favoriteCount);
        response.put("message", isFavorited ? "찜 목록에 추가되었습니다." : "찜하기가 취소되었습니다.");

        return ResponseEntity.ok(response);
    }

    /**
     * 특정 상품의 찜 상태 확인
     * GET /api/v1/favorites/{productId}/status?userId=1
     */
    @GetMapping("/{productId}/status")
    public ResponseEntity<Map<String, Object>> getFavoriteStatus(
            @PathVariable Long productId,
            @RequestParam Long userId) {

        boolean isFavorited = favoriteService.isFavorite(productId, userId);
        long favoriteCount = favoriteService.getFavoriteCount(productId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("isFavorited", isFavorited);
        response.put("favoriteCount", favoriteCount);

        return ResponseEntity.ok(response);
    }

    /**
     * 사용자가 찜한 상품 ID 목록 조회
     * GET /api/v1/favorites/my-products?userId=1
     */
    @GetMapping("/my-products")
    public ResponseEntity<Map<String, Object>> getMyFavoriteProducts(
            @RequestParam Long userId) {

        Set<Long> favoriteProductIds = favoriteService.getFavoriteProductIds(userId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("productIds", favoriteProductIds);

        return ResponseEntity.ok(response);
    }
}
