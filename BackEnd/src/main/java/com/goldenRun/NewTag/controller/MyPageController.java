package com.goldenRun.NewTag.controller;

import com.goldenRun.NewTag.dto.ProductDtos.ListItem; // Product -> ListItem
import com.goldenRun.NewTag.dto.ProductDtos.StatusUpdateRequest;
import com.goldenRun.NewTag.dto.UserDtos.ProfileUpdateRequest;
import com.goldenRun.NewTag.dto.UserDtos.UserProfileData;
import com.goldenRun.NewTag.dto.UserDtos.PurchaseItem; // 구매 내역 DTO
import com.goldenRun.NewTag.dto.UserDtos.ReviewItem; // 후기 DTO
import com.goldenRun.NewTag.service.MyPageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/mypage") // 프론트엔드 명세와 동일하게 /api/v1/mypage
public class MyPageController {

    private final MyPageService myPageService;

    // 1. 프로필 정보 조회
    // GET /api/v1/mypage/profile
    @GetMapping("/profile")
    public ResponseEntity<UserProfileData> getProfile() {
        try {
            UserProfileData response = myPageService.getProfile();
            return ResponseEntity.ok(response);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build(); // 401
        }
    }

    // 2. 프로필 정보 업데이트
    // PUT /api/v1/mypage/profile (프론트엔드 명세에 따라 Patch 대신 Put 사용)
    @PutMapping("/profile")
    public ResponseEntity<Void> updateProfile(
            @Valid @RequestBody ProfileUpdateRequest request) { // DTO 필드명은 nickName, profileImageUrl에 맞춰야 함
        try {
            myPageService.updateProfile(request);
            return ResponseEntity.ok().build(); // 200 OK
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build(); // 404
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build(); // 500
        }
    }

    // 3. 내가 등록한 판매 상품 목록 조회
    // GET /api/v1/mypage/products
    @GetMapping("/products")
    public ResponseEntity<List<ListItem>> getRegisteredProducts() { // Product[] -> List<ListItem>
        try {
            List<ListItem> listItems = myPageService.getRegisteredProducts();
            return ResponseEntity.ok(listItems);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build(); // 401
        }
    }

    // 4. 관심 목록(찜) 조회
    // GET /api/v1/mypage/favorites
    @GetMapping("/favorites")
    public ResponseEntity<List<ListItem>> getFavorites() { // Product[] -> List<ListItem>
        try {
            List<ListItem> listItems = myPageService.getFavorites();
            return ResponseEntity.ok(listItems);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build(); // 401
        }
    }

    // 5. 구매 내역 목록 조회
    // GET /api/v1/mypage/purchases
    @GetMapping("/purchases")
    public ResponseEntity<List<PurchaseItem>> getPurchaseHistory() {
        try {
            List<PurchaseItem> items = myPageService.getPurchaseHistory();
            return ResponseEntity.ok(items);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build(); // 401
        }
    }

    // 6. 받은 후기 목록 조회
    // GET /api/v1/mypage/reviews/received
    @GetMapping("/reviews/received")
    public ResponseEntity<List<ReviewItem>> getReviews() {
        try {
            List<ReviewItem> reviews = myPageService.getReviews();
            return ResponseEntity.ok(reviews);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build(); // 401
        }
    }

    // 7. 특정 상품의 상태 업데이트
    // PUT /api/v1/mypage/products/{id}/status
    @PutMapping("/products/{productId}/status") // PUT 메서드 사용
    public ResponseEntity<Void> updateProductStatus(
            @PathVariable Long productId,
            @RequestBody StatusUpdateRequest request) { // DTO를 사용하여 상태를 받음
        try {
            myPageService.updateProductStatus(productId, request.getStatus().name());
            return ResponseEntity.ok().build(); // 200 OK
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build(); // 404
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build(); // 403
        }
    }
    
    // 8. 특정 상품 삭제
    // DELETE /api/v1/mypage/products/{id}
    @DeleteMapping("/products/{productId}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long productId) {
        try {
            myPageService.deleteProduct(productId);
            return ResponseEntity.noContent().build(); // 204 No Content
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build(); // 404
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build(); // 403
        }
    }
}