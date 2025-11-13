package com.goldenRun.NewTag.controller;

import com.goldenRun.NewTag.dto.ProductDtos;
import com.goldenRun.NewTag.dto.ProductRequest;
import com.goldenRun.NewTag.entity.Product;
import com.goldenRun.NewTag.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/products") // 기본 경로: /api/products
public class ProductController {

    private final ProductService productService;

    // (*** 이전 글 작성 (POST) 메서드는 생략되었습니다. ***)
    
    // --- 1. 상품 수정 (PUT /api/products/{productId}) ---
    @PutMapping("/{productId}")
    public ResponseEntity<Product> updateProduct(@PathVariable Integer productId, 
                                                 @Valid @RequestBody ProductDtos.UpdateRequest request) {
        try {
        	Product updatedProduct = productService.updateProduct(productId, request);
            // HTTP 200 OK 응답
            return ResponseEntity.ok(updatedProduct);
        } catch (NoSuchElementException e) {
            // 상품 ID를 찾을 수 없을 때
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build(); // 404 Not Found
        } catch (SecurityException e) {
            // 로그인 사용자와 판매자가 일치하지 않을 때
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build(); // 403 Forbidden (권한 없음)
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // --- 2. 상품 삭제 (DELETE /api/products/{productId}) ---
    @DeleteMapping("/{productId}")
    public ResponseEntity<Map<String, String>> deleteProduct(@PathVariable Integer productId) {
        try {
            productService.deleteProduct(productId);
            // HTTP 200 OK와 성공 메시지 반환
            return ResponseEntity.ok(Map.of("message", "상품이 성공적으로 삭제(비활성화)되었습니다."));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build(); // 404 Not Found
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build(); // 403 Forbidden (권한 없음)
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}