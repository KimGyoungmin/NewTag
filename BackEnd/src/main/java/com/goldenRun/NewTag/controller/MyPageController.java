package com.goldenRun.NewTag.controller;

import com.goldenRun.NewTag.dto.ProductDtos;
import com.goldenRun.NewTag.dto.ProductDtos.ListItem; 
import com.goldenRun.NewTag.dto.UserDtos.*;
import com.goldenRun.NewTag.entity.Product;
import com.goldenRun.NewTag.service.MyPageSercice;
import com.goldenRun.NewTag.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/user")
public class MyPageController {

    private final MyPageSercice myPageService;

    
    // 프로필 이미지/닉네임 업데이트
    
    @PatchMapping("/profile")
    public ResponseEntity<Void> updateProfile(
            @Valid @RequestBody ProfileUpdateRequest request) {
        try {
            myPageService.updateProfile(request);
            return ResponseEntity.ok().build(); // 200 OK
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build(); // 404 Not Found
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build(); // 500
        }
    }

    
    //  마이페이지 대시보드 데이터 조회
    
    @GetMapping("/mypage")
    public ResponseEntity<MyPageResponse> getMyPageData() {
        try {
            MyPageResponse response = myPageService.getMyPageData();
            return ResponseEntity.ok(response);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build(); // 401 Unauthorized
        }
    }

    
    // 거래 후기 조회 (보기만 가능)
    
    @GetMapping("/reviews/received")
    public ResponseEntity<List<ReviewItem>> getReceivedReviews() {
        try {
            List<ReviewItem> reviews = myPageService.getReceivedReviews();
            return ResponseEntity.ok(reviews);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build(); // 401
        }
    }

    
    //  판매 내역 페이지 (내가 판 상품)
   
    @GetMapping("/products/sold")
    public ResponseEntity<List<ProductDtos.ListItem>> getMySoldProducts() {
        try {
            List<Product> products = myPageService.getMySoldProducts();
            // Product 엔티티를 ProductDtos.ListItem으로 변환 (변환 로직은 생략)
            List<ProductDtos.ListItem> listItems = products.stream()
                    .map(this::convertToListItem) 
                    .collect(Collectors.toList());
            return ResponseEntity.ok(listItems);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build(); // 401
        }
    }
    
    
    // 거래 히스토리 상세 (월별, 연도별)
    
    @GetMapping("/transactions/history")
    public ResponseEntity<TransactionHistoryResponse> getTransactionHistory() {
        try {
            TransactionHistoryResponse response = myPageService.getTransactionHistory();
            return ResponseEntity.ok(response);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build(); // 401
        }
    }
    
   
    //  차단 사용자 관리 (목록 조회)
    
    @GetMapping("/blocks")
    public ResponseEntity<List<UserListItem>> getBlockedUsers() {
        try {
            List<UserListItem> users = myPageService.getBlockedUsers();
            return ResponseEntity.ok(users);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build(); // 401
        }
    }

    
    //  신고 내역 (내가 신고한 내역 목록)
    
    @GetMapping("/reports/mine")
    public ResponseEntity<List<UserListItem>> getMyReportHistory() {
        try {
            List<UserListItem> reports = myPageService.getMyReportHistory();
            return ResponseEntity.ok(reports);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build(); // 401
        }
    }
    
   
    //  Product 엔티티를 ListItem DTO로 변환하는 메서드 (간소화)
   
    private ProductDtos.ListItem convertToListItem(Product product) {
        return ProductDtos.ListItem.builder()
                .id(product.getId())
                .title(product.getTitle())
                .price(product.getPrice())
                .locationNm(product.getLocation_nm())
                // 기타 필드 매핑 로직 (mainImage, likes, views 등) 생략
                .build();
    }
}