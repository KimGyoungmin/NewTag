package com.goldenRun.NewTag.controller;

import com.goldenRun.NewTag.dto.ProductDtos;
import com.goldenRun.NewTag.enums.ProductStatus;
import com.goldenRun.NewTag.service.ProductService;
import com.goldenRun.NewTag.service.SearchLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"}, allowCredentials = "true")
public class ProductController {

    private final ProductService productService;
    private final SearchLogService searchLogService;

    /**
     * 상품 목록 조회
     * GET /api/v1/products?categoryId=1&sortBy=latest&page=0&size=20
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getProducts(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "latest") String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<ProductDtos.ListItem> products = productService.getProductList(categoryId, sortBy, page, size);

        Map<String, Object> response = new HashMap<>();
        response.put("products", products.getContent());
        response.put("currentPage", products.getNumber());
        response.put("totalPages", products.getTotalPages());
        response.put("totalElements", products.getTotalElements());
        response.put("hasNext", products.hasNext());

        return ResponseEntity.ok(response);
    }

    /**
     * 상품 상세 조회
     * GET /api/v1/products/{id}?userId=1
     */
    @GetMapping("/{id}")
    public ResponseEntity<ProductDtos.DetailResponse> getProductDetail(
            @PathVariable Long id,
            @RequestParam(required = false) Long userId
    ) {
        ProductDtos.DetailResponse product = productService.getProductDetail(id, userId);
        return ResponseEntity.ok(product);
    }

    @GetMapping("/{id}/related")
    public ResponseEntity<List<ProductDtos.ListItem>> getRelatedProducts(
            @PathVariable Long id,
            @RequestParam(defaultValue = "6") int limit
    ) {
        List<ProductDtos.ListItem> related = productService.getRelatedProducts(id, limit);
        return ResponseEntity.ok(related);
    }

    /**
     * 판매자의 다른 상품 조회 (현재 상품 제외)
     * GET /api/v1/products/{id}/seller-other?limit=6
     */
    @GetMapping("/{id}/seller-other")
    public ResponseEntity<List<ProductDtos.ListItem>> getOtherProductsBySeller(
            @PathVariable Long id,
            @RequestParam(defaultValue = "6") int limit
    ) {
        List<ProductDtos.ListItem> otherProducts = productService.getOtherProductsBySeller(id, limit);
        return ResponseEntity.ok(otherProducts);
    }

    /**
     * 상품 검색 (검색 로그 자동 저장)
     * GET /api/v1/products/search?keyword=아이폰&userId=1&deviceType=MOBILE&page=0&size=20
     */
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchProducts(
            @RequestParam String keyword,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String deviceType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<ProductDtos.ListItem> products = productService.searchProducts(
                keyword, userId, deviceType, page, size
        );

        Map<String, Object> response = new HashMap<>();
        response.put("products", products.getContent());
        response.put("currentPage", products.getNumber());
        response.put("totalPages", products.getTotalPages());
        response.put("totalElements", products.getTotalElements());
        response.put("hasNext", products.hasNext());
        response.put("keyword", keyword);

        return ResponseEntity.ok(response);
    }

    /**
     * 판매자별 상품 조회
     * GET /api/v1/products/seller/{sellerId}?page=0&size=20
     */
    @GetMapping("/seller/{sellerId}")
    public ResponseEntity<Map<String, Object>> getProductsBySeller(
            @PathVariable Long sellerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<ProductDtos.ListItem> products = productService.getProductsBySeller(sellerId, page, size);

        Map<String, Object> response = new HashMap<>();
        response.put("products", products.getContent());
        response.put("currentPage", products.getNumber());
        response.put("totalPages", products.getTotalPages());
        response.put("totalElements", products.getTotalElements());
        response.put("hasNext", products.hasNext());

        return ResponseEntity.ok(response);
    }

    /**
     * 인기 검색어 조회
     * GET /api/v1/products/search/popular?limit=10
     */
    @GetMapping("/search/popular")
    public ResponseEntity<List<String>> getPopularKeywords(
            @RequestParam(defaultValue = "10") int limit
    ) {
        List<String> keywords = searchLogService.getPopularKeywords(limit);
        return ResponseEntity.ok(keywords);
    }

    /**
     * 사용자 최근 검색어 조회
     * GET /api/v1/products/search/recent?userId=1&limit=10
     */
    @GetMapping("/search/recent")
    public ResponseEntity<List<String>> getRecentKeywords(
            @RequestParam Long userId,
            @RequestParam(defaultValue = "10") int limit
    ) {
        List<String> keywords = searchLogService.getRecentKeywords(userId, limit);
        return ResponseEntity.ok(keywords);
    }

    /**
     * 특정 검색어 삭제
     * DELETE /api/v1/products/search/recent?userId=1&keyword=빵빵이
     */
    @DeleteMapping("/search/recent")
    public ResponseEntity<Map<String, Object>> deleteRecentKeyword(
            @RequestParam Long userId,
            @RequestParam String keyword
    ) {
        searchLogService.deleteRecentKeyword(userId, keyword);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "검색어가 삭제되었습니다."
        ));
    }

    /**
     * 모든 검색어 삭제
     * DELETE /api/v1/products/search/recent/all?userId=1
     */
    @DeleteMapping("/search/recent/all")
    public ResponseEntity<Map<String, Object>> deleteAllRecentKeywords(
            @RequestParam Long userId
    ) {
        searchLogService.deleteAllRecentKeywords(userId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "모든 검색어가 삭제되었습니다."
        ));
    }

    /**
     * 상품 등록
     * POST /api/v1/products
     */
    @PostMapping
    public ResponseEntity<ProductDtos.DetailResponse> createProduct(
            @RequestBody ProductDtos.CreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        ProductDtos.DetailResponse created = productService.createProduct(request, userDetails.getUsername());
        return ResponseEntity.status(201).body(created);
    }

    /**
     * 상품 삭제 (소프트 삭제)
     * DELETE /api/v1/products/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteProduct(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        productService.deleteProduct(id, userDetails.getUsername());
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "상품이 삭제되었습니다."
        ));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ProductDtos.DetailResponse> updateStatus(
            @PathVariable Long id,
            @RequestBody ProductDtos.StatusUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        if (request.getStatus() == null) {
            throw new IllegalArgumentException("변경할 상태를 선택해주세요.");
        }
        ProductDtos.DetailResponse updated = productService.updateProductStatus(id, request.getStatus(), userDetails.getUsername());
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<ProductDtos.CompleteSaleResponse> completeSale(
            @PathVariable Long id,
            @RequestBody ProductDtos.CompleteSaleRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        ProductDtos.CompleteSaleResponse response = productService.completeSale(id, request.getBuyerId(), userDetails.getUsername());
        return ResponseEntity.ok(response);
    }
}
