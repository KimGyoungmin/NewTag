package com.goldenRun.NewTag.controller;

import com.goldenRun.NewTag.Repository.UserRepository;
import com.goldenRun.NewTag.dto.ProductDtos;
import com.goldenRun.NewTag.entity.User;
import com.goldenRun.NewTag.enums.ProductStatus;
import com.goldenRun.NewTag.service.FavoriteService;
import com.goldenRun.NewTag.service.FileStorageService;
import com.goldenRun.NewTag.service.ProductService;
import com.goldenRun.NewTag.service.SearchLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.util.CollectionUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final SearchLogService searchLogService;
    private final FileStorageService fileStorageService;
    private final FavoriteService favoriteService;
    private final UserRepository userRepository;

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
        response.put("content", products.getContent());
        response.put("currentPage", products.getNumber());
        response.put("totalPages", products.getTotalPages());
        response.put("totalElements", products.getTotalElements());
        response.put("pageSize", products.getSize());
        response.put("hasNext", products.hasNext());

        return ResponseEntity.ok(response);
    }

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

    @GetMapping("/{id}/seller-other")
    public ResponseEntity<List<ProductDtos.ListItem>> getOtherProductsBySeller(
            @PathVariable Long id,
            @RequestParam(defaultValue = "6") int limit
    ) {
        List<ProductDtos.ListItem> otherProducts = productService.getOtherProductsBySeller(id, limit);
        return ResponseEntity.ok(otherProducts);
    }

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
        response.put("content", products.getContent());
        response.put("currentPage", products.getNumber());
        response.put("totalPages", products.getTotalPages());
        response.put("totalElements", products.getTotalElements());
        response.put("pageSize", products.getSize());
        response.put("hasNext", products.hasNext());
        response.put("keyword", keyword);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/seller/{sellerId}")
    public ResponseEntity<Map<String, Object>> getProductsBySeller(
            @PathVariable Long sellerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<ProductDtos.ListItem> products = productService.getProductsBySeller(sellerId, page, size);

        Map<String, Object> response = new HashMap<>();
        response.put("products", products.getContent());
        response.put("content", products.getContent());
        response.put("currentPage", products.getNumber());
        response.put("totalPages", products.getTotalPages());
        response.put("totalElements", products.getTotalElements());
        response.put("pageSize", products.getSize());
        response.put("hasNext", products.hasNext());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/my")
    public ResponseEntity<List<ProductDtos.ListItem>> getMyProducts(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<ProductDtos.ListItem> products = productService.getMyProducts(userDetails.getUsername());
        return ResponseEntity.ok(products);
    }

    @GetMapping("/search/popular")
    public ResponseEntity<List<String>> getPopularKeywords(
            @RequestParam(defaultValue = "10") int limit
    ) {
        List<String> keywords = searchLogService.getPopularKeywords(limit);
        return ResponseEntity.ok(keywords);
    }

    @GetMapping("/search/recent")
    public ResponseEntity<List<String>> getRecentKeywords(
            @RequestParam Long userId,
            @RequestParam(defaultValue = "10") int limit
    ) {
        List<String> keywords = searchLogService.getRecentKeywords(userId, limit);
        return ResponseEntity.ok(keywords);
    }

    @DeleteMapping("/search/recent")
    public ResponseEntity<Map<String, Object>> deleteRecentKeyword(
            @RequestParam Long userId,
            @RequestParam String keyword
    ) {
        searchLogService.deleteRecentKeyword(userId, keyword);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Keyword deleted"
        ));
    }

    @DeleteMapping("/search/recent/all")
    public ResponseEntity<Map<String, Object>> deleteAllRecentKeywords(
            @RequestParam Long userId
    ) {
        searchLogService.deleteAllRecentKeywords(userId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "All keywords deleted"
        ));
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ProductDtos.DetailResponse> createProduct(
            @Valid @RequestBody ProductDtos.CreateRequest request,
           @AuthenticationPrincipal UserDetails userDetails
    ) {
        ProductDtos.DetailResponse created = productService.createProduct(request, userDetails.getUsername());
        return ResponseEntity.status(201).body(created);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProductDtos.DetailResponse> createProductMultipart(
            @RequestParam Double price,
            @RequestParam String title,
            @RequestParam String content,
            @RequestParam Integer categoryId,
            @RequestParam String locationNm,
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(required = false) Boolean isResell,
            @RequestParam(value = "images", required = false) List<MultipartFile> images,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        List<ProductDtos.ImageItem> imageItems = new ArrayList<>();
        if (!CollectionUtils.isEmpty(images)) {
            for (int i = 0; i < images.size(); i++) {
                MultipartFile file = images.get(i);
                String storedPath = fileStorageService.storeProductImage(file, null, i == 0);
                imageItems.add(ProductDtos.ImageItem.builder()
                        .path(storedPath)
                        .isMain(i == 0)
                        .build());
            }
        }

        ProductDtos.CreateRequest dto = ProductDtos.CreateRequest.builder()
                .price(price)
                .title(title)
                .content(content)
                .categoryId(categoryId)
                .locationNm(locationNm)
                .latitude(latitude)
                .longitude(longitude)
                .isResell(isResell)
                .images(imageItems)
                .build();

        ProductDtos.DetailResponse created = productService.createProduct(dto, userDetails.getUsername());
        return ResponseEntity.status(201).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductDtos.DetailResponse> updateProduct(
            @PathVariable Long id,
            @RequestBody ProductDtos.UpdateRequest request,
            @AuthenticationPrincipal(expression = "username") String currentUserNick
    ) {
        ProductDtos.DetailResponse updated = productService.updateProduct(id, request, currentUserNick);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteProduct(
            @PathVariable Long id,
            @AuthenticationPrincipal(expression = "username") String currentUserNick
    ) {
        productService.deleteProduct(id, currentUserNick);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Product deleted"
        ));
    }

    @PostMapping("/{id}/favorite")
    public ResponseEntity<Map<String, Object>> toggleFavorite(
            @PathVariable Long id,
            @AuthenticationPrincipal(expression = "username") String currentUserNick,
            @RequestParam(required = false) Long userId
    ) {
        Long effectiveUserId = userId;
        if (effectiveUserId == null && currentUserNick != null) {
            User user = userRepository.findByNick(currentUserNick);
            if (user != null) {
                effectiveUserId = user.getId();
            }
        }
        if (effectiveUserId == null) {
            throw new IllegalArgumentException("사용자 정보가 필요합니다.");
        }

        boolean isFavorited = favoriteService.toggleFavorite(id, effectiveUserId);
        long favoriteCount = favoriteService.getFavoriteCount(id);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "isFavorite", isFavorited,
                "favoriteCount", favoriteCount
        ));
    }

    @GetMapping("/favorites")
    public ResponseEntity<Map<String, Object>> getFavorites(
            @AuthenticationPrincipal(expression = "username") String currentUserNick,
            @RequestParam(required = false) Long userId
    ) {
        Long effectiveUserId = userId;
        if (effectiveUserId == null && currentUserNick != null) {
            User user = userRepository.findByNick(currentUserNick);
            if (user != null) {
                effectiveUserId = user.getId();
            }
        }
        if (effectiveUserId == null) {
            throw new IllegalArgumentException("사용자 정보가 필요합니다.");
        }

        final Long userIdForFavorites = effectiveUserId;
        List<Long> favoriteProductIds = favoriteService.getFavoriteProductIds(userIdForFavorites).stream().toList();
        List<ProductDtos.DetailResponse> items = favoriteProductIds.stream()
                .map(id -> productService.getProductDetail(id, userIdForFavorites))
                .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
                "success", true,
                "products", items,
                "content", items
        ));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ProductDtos.DetailResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody ProductDtos.StatusUpdateRequest request,
            @AuthenticationPrincipal(expression = "username") String currentUserNick
    ) {
        if (request.getStatus() == null) {
            throw new IllegalArgumentException("변경할 상태를 선택해 주세요.");
        }
        ProductDtos.DetailResponse updated = productService.updateProductStatus(id, request.getStatus(), currentUserNick);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<ProductDtos.CompleteSaleResponse> completeSale(
            @PathVariable Long id,
            @Valid @RequestBody ProductDtos.CompleteSaleRequest request,
            @AuthenticationPrincipal(expression = "username") String currentUserNick
    ) {
        ProductDtos.CompleteSaleResponse response = productService.completeSale(id, request.getBuyerId(), currentUserNick);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/view")
    public ResponseEntity<Map<String, Object>> increaseViewCount(@PathVariable Long id) {
        productService.incrementViewCount(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/location")
    public ResponseEntity<List<ProductDtos.ListItem>> getProductsByLocation(
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam Double radius
    ) {
        return ResponseEntity.ok(productService.getProductsByLocation(latitude, longitude, radius));
    }
}
