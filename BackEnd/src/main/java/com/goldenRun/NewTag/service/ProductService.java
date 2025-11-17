package com.goldenRun.NewTag.service;

import com.goldenRun.NewTag.Repository.ProductRepository;
import com.goldenRun.NewTag.dto.ProductDtos;
import com.goldenRun.NewTag.entity.Product;
import com.goldenRun.NewTag.entity.ProductImage;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;
    private final SearchLogService searchLogService;
    private final ReviewService reviewService;
    private final FavoriteService favoriteService;

    /**
     * 상품 목록 조회 (페이징, 정렬, 필터링)
     */
    public Page<ProductDtos.ListItem> getProductList(
            Long categoryId,
            String sortBy,
            int page,
            int size
    ) {
        Pageable pageable = createPageable(sortBy, page, size);

        Page<Product> products;
        if (categoryId != null && categoryId > 0) {
            products = productRepository.findByCategoryNotDeleted(categoryId, pageable);
        } else {
            products = productRepository.findAllNotDeleted(pageable);
        }

        // 모든 상품의 ID를 수집
        List<Long> productIds = products.getContent().stream()
                .map(Product::getId)
                .collect(Collectors.toList());

        // 한 번의 쿼리로 모든 상품의 찜 개수 조회 (N+1 문제 해결)
        Map<Long, Long> favoriteCountMap = favoriteService.getFavoriteCounts(productIds);

        return products.map(product -> convertToListItem(product, favoriteCountMap));
    }

    /**
     * 상품 상세 조회
     */
    @Transactional
    public ProductDtos.DetailResponse getProductDetail(Long productId, Long currentUserId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

        if (product.getIs_delete()) {
            throw new IllegalArgumentException("삭제된 상품입니다.");
        }

        // 조회수 증가
        product.increaseView();

        return convertToDetailResponse(product, currentUserId);
    }

    /**
     * 판매자별 상품 목록 조회
     */
    public Page<ProductDtos.ListItem> getProductsBySeller(Long sellerId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Product> products = productRepository.findBySellerNotDeleted(sellerId, pageable);

        // 모든 상품의 ID를 수집
        List<Long> productIds = products.getContent().stream()
                .map(Product::getId)
                .collect(Collectors.toList());

        // 한 번의 쿼리로 모든 상품의 찜 개수 조회 (N+1 문제 해결)
        Map<Long, Long> favoriteCountMap = favoriteService.getFavoriteCounts(productIds);

        return products.map(product -> convertToListItem(product, favoriteCountMap));
    }

    /**
     * 상품 검색 (검색 로그 자동 저장)
     */
    @Transactional
    public Page<ProductDtos.ListItem> searchProducts(
            String keyword,
            Long userId,
            String deviceType,
            int page,
            int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Product> products = productRepository.searchByTitle(keyword, pageable);

        // 검색 로그 저장
        if (userId != null && keyword != null && !keyword.trim().isEmpty()) {
            searchLogService.logSearch(userId, keyword, (int) products.getTotalElements(), deviceType);
        }

        // 모든 상품의 ID를 수집
        List<Long> productIds = products.getContent().stream()
                .map(Product::getId)
                .collect(Collectors.toList());

        // 한 번의 쿼리로 모든 상품의 찜 개수 조회 (N+1 문제 해결)
        Map<Long, Long> favoriteCountMap = favoriteService.getFavoriteCounts(productIds);

        return products.map(product -> convertToListItem(product, favoriteCountMap));
    }

    // ============================================
    // Private Helper Methods
    // ============================================

    /**
     * Pageable 객체 생성 (정렬 기준 적용)
     */
    private Pageable createPageable(String sortBy, int page, int size) {
        Sort sort = switch (sortBy) {
            case "price-low" -> Sort.by(Sort.Direction.ASC, "price");
            case "price-high" -> Sort.by(Sort.Direction.DESC, "price");
            case "popular" -> Sort.by(Sort.Direction.DESC, "view_count");
            default -> Sort.by(Sort.Direction.DESC, "createdAt"); // latest
        };
        return PageRequest.of(page, size, sort);
    }

    /**
     * Product -> ListItem 변환 (Map을 사용한 최적화 버전)
     */
    private ProductDtos.ListItem convertToListItem(Product product, Map<Long, Long> favoriteCountMap) {
        String mainImage = product.getImages().stream()
                .filter(img -> img.getIs_main())
                .findFirst()
                .map(ProductImage::getPath)
                .orElse("p_default_img.png");

        // Map에서 Favorite count 조회 (이미 한 번에 가져온 데이터)
        long favoriteCount = favoriteCountMap.getOrDefault(product.getId(), 0L);

        return ProductDtos.ListItem.builder()
                .id(product.getId().intValue())
                .mainImage(mainImage)
                .title(product.getTitle())
                .price(product.getPrice().doubleValue())
                .locationNm(product.getLocation_nm())
                .createdAt(product.getCreatedAt())
                .viewCount(product.getView_count())
                .favoriteCount(favoriteCount)
                .timeAgo(getTimeAgo(product.getCreatedAt()))
                .build();
    }

    /**
     * Product -> ListItem 변환 (기존 버전 - 하위 호환성)
     */
    private ProductDtos.ListItem convertToListItem(Product product) {
        String mainImage = product.getImages().stream()
                .filter(img -> img.getIs_main())
                .findFirst()
                .map(ProductImage::getPath)
                .orElse("p_default_img.png");

        // Favorite count 조회
        long favoriteCount = favoriteService.getFavoriteCount(product.getId());

        return ProductDtos.ListItem.builder()
                .id(product.getId().intValue())
                .mainImage(mainImage)
                .title(product.getTitle())
                .price(product.getPrice().doubleValue())
                .locationNm(product.getLocation_nm())
                .createdAt(product.getCreatedAt())
                .viewCount(product.getView_count())
                .favoriteCount(favoriteCount)
                .timeAgo(getTimeAgo(product.getCreatedAt()))
                .build();
    }

    /**
     * Product -> DetailResponse 변환
     */
    private ProductDtos.DetailResponse convertToDetailResponse(Product product, Long currentUserId) {
        List<ProductImage> sortedImages = product.getImages().stream()
                .sorted((a, b) -> Boolean.compare(b.getIs_main(), a.getIs_main())) // 메인 이미지 우선
                .collect(Collectors.toList());

        List<ProductDtos.ImageResponse> images = sortedImages.stream()
                .map(img -> ProductDtos.ImageResponse.builder()
                        .id(img.getId().intValue())
                        .pImg(img.getPath())
                        .isMain(img.getIs_main())
                        .createdAt(img.getCreatedAt())
                        .updatedAt(img.getUpdatedAt())
                        .productId(product.getId().intValue())
                        .build())
                .collect(Collectors.toList());

        String mainImage = sortedImages.isEmpty() ? "p_default_img.png" : sortedImages.get(0).getPath();

        // Favorite count와 likedByMe 조회
        long favoriteCount = favoriteService.getFavoriteCount(product.getId());
        boolean likedByMe = currentUserId != null && favoriteService.isFavorite(product.getId(), currentUserId);

        // 판매자 평점 정보 (ReviewService 연동)
        Long sellerId = product.getSeller().getId();
        double sellerRatingAvg = reviewService.getAverageRating(sellerId);
        long sellerRatingCount = reviewService.getReviewCount(sellerId);

        return ProductDtos.DetailResponse.builder()
                .id(product.getId().intValue())
                .title(product.getTitle())
                .price(product.getPrice().doubleValue())
                .content(product.getContent())
                .status(product.getStatus())
                .locationNm(product.getLocation_nm())
                .latitude(product.getLatitude().doubleValue())
                .longitude(product.getLongitude().doubleValue())
                .viewCount(product.getView_count())
                .favoriteCount(favoriteCount)
                .timeAgo(getTimeAgo(product.getCreatedAt()))
                .createdAt(product.getCreatedAt())
                .categoryId(product.getCategory().getId().intValue())
                .images(images)
                .mainImage(mainImage)
                .sellerId(product.getSeller().getId().intValue())
                .sellerName(product.getSeller().getName())
                .sellerNick(product.getSeller().getNick())
                .sellerProfileImg(product.getSeller().getProfileImg())
                .sellerRatingAvg(sellerRatingAvg)
                .sellerRatingCount(sellerRatingCount)
                .sellerGrade(reviewService.calculateUserGrade(sellerId))
                .likedByMe(likedByMe)
                .build();
    }

    /**
     * 시간 경과 문자열 생성
     */
    private String getTimeAgo(LocalDateTime createdAt) {
        Duration duration = Duration.between(createdAt, LocalDateTime.now());

        long minutes = duration.toMinutes();
        if (minutes < 1) return "방금 전";
        if (minutes < 60) return minutes + "분 전";

        long hours = duration.toHours();
        if (hours < 24) return hours + "시간 전";

        long days = duration.toDays();
        if (days < 7) return days + "일 전";
        if (days < 30) return (days / 7) + "주 전";
        if (days < 365) return (days / 30) + "개월 전";

        return (days / 365) + "년 전";
    }
}
