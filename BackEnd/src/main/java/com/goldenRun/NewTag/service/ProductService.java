package com.goldenRun.NewTag.service;

import com.goldenRun.NewTag.Repository.CategoryRepository;
import com.goldenRun.NewTag.Repository.ProductRepository;
import com.goldenRun.NewTag.Repository.TransactionRepository;
import com.goldenRun.NewTag.Repository.UserRepository;
import com.goldenRun.NewTag.dto.ProductDtos;
import com.goldenRun.NewTag.entity.Category;
import com.goldenRun.NewTag.entity.Product;
import com.goldenRun.NewTag.entity.ProductImage;
import com.goldenRun.NewTag.entity.Transaction;
import com.goldenRun.NewTag.entity.User;
import com.goldenRun.NewTag.enums.ProductStatus;
import com.goldenRun.NewTag.enums.TransactionStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class ProductService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;
    private final SearchLogService searchLogService;
    private final ReviewService reviewService;
    private final FavoriteService favoriteService;
    private final FileStorageService fileStorageService;

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

    @Transactional
    public ProductDtos.DetailResponse updateProductStatus(Long productId, ProductStatus newStatus, String currentUserNick) {
        if (currentUserNick == null || currentUserNick.isBlank()) {
            throw new AccessDeniedException("인증 정보가 필요합니다.");
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

        if (!currentUserNick.equals(product.getSeller().getNick())) {
            throw new AccessDeniedException("상품 상태를 변경할 권한이 없습니다.");
        }

        product.setStatus(newStatus);

        Long sellerId = product.getSeller() != null ? product.getSeller().getId() : null;
        return convertToDetailResponse(product, sellerId);
    }

    @Transactional
    public ProductDtos.CompleteSaleResponse completeSale(Long productId, Long buyerId, String currentUserNick) {
        if (buyerId == null) {
            throw new IllegalArgumentException("구매자를 선택해 주세요.");
        }
        if (!StringUtils.hasText(currentUserNick)) {
            throw new AccessDeniedException("인증 정보가 필요합니다.");
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

        if (!currentUserNick.equals(product.getSeller().getNick())) {
            throw new AccessDeniedException("상품의 판매자만 구매자를 지정할 수 있습니다.");
        }

        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new IllegalArgumentException("구매자 정보를 찾을 수 없습니다."));

        product.setStatus(ProductStatus.SOLD_OUT);

        Transaction transaction = transactionRepository.findByProductId(productId)
                .orElse(Transaction.builder()
                        .product(product)
                        .seller(product.getSeller())
                        .buyer(buyer)
                        .status(TransactionStatus.COMPLETED)
                        .build());

        transaction.setBuyer(buyer);
        transaction.setSeller(product.getSeller());
        transaction.setStatus(TransactionStatus.COMPLETED);
        transaction.setUpdatedAt(LocalDateTime.now());

        if (transaction.getProduct() == null) {
            transaction.setProduct(product);
        }

        Transaction saved = transactionRepository.save(transaction);

        ProductDtos.DetailResponse detail = convertToDetailResponse(product, product.getSeller().getId());
        return ProductDtos.CompleteSaleResponse.builder()
                .product(detail)
                .transactionId(saved.getId())
                .build();
    }

    /**
     * 상품 등록 (PostService의 createPost 통합)
     */
    @Transactional
    public ProductDtos.DetailResponse createProduct(ProductDtos.CreateRequest request, String currentUserNick) {
        User seller = resolveCurrentUser(currentUserNick);
        Category category = resolveCategory(request.getCategoryId());

        // 1. Product 엔티티 생성
        Product product = buildProductEntity(request, seller, category);

        // 2. Product 저장 (이미지는 temp 폴더 경로로 저장됨)
        Product saved = productRepository.save(product);

        // 3. temp 폴더의 이미지를 products/{productId}/ 폴더로 이동
        migrateImagesToProductFolder(saved);

        log.info("상품 등록 완료: productId={}, 이미지 개수={}", saved.getId(), saved.getImages().size());

        return convertToDetailResponse(saved, seller.getId());
    }

    /**
     * 상품 삭제 (소프트 삭제)
     */
    @Transactional
    public void deleteProduct(Long productId, String currentUserNick) {
        User seller = resolveCurrentUser(currentUserNick);

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

        if (!product.getSeller().getId().equals(seller.getId())) {
            throw new AccessDeniedException("본인이 등록한 상품만 삭제할 수 있습니다.");
        }

        product.setIs_delete(true);
        product.setUpdatedAt(LocalDateTime.now());

        log.info("상품 삭제 완료: productId={}, seller={}", productId, currentUserNick);
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
                .filter(ProductImage::getIs_main)
                .findFirst()
                .map(img -> resolveImagePath(img.getPath()))
                .orElse(resolveImagePath(null));

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
                .isResell(product.getIsResell())
                .build();
    }

    /**
     * Product -> ListItem 변환 (기존 버전 - 하위 호환성)
     */
    private ProductDtos.ListItem convertToListItem(Product product) {
        String mainImage = product.getImages().stream()
                .filter(ProductImage::getIs_main)
                .findFirst()
                .map(img -> resolveImagePath(img.getPath()))
                .orElse(resolveImagePath(null));

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
                .isResell(product.getIsResell())
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
                        .pImg(resolveImagePath(img.getPath()))
                        .isMain(img.getIs_main())
                        .createdAt(img.getCreatedAt())
                        .updatedAt(img.getUpdatedAt())
                        .productId(product.getId().intValue())
                        .build())
                .collect(Collectors.toList());

        String mainImage = sortedImages.isEmpty()
                ? resolveImagePath(null)
                : resolveImagePath(sortedImages.get(0).getPath());

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
                .isResell(product.getIsResell())
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

    private String resolveImagePath(String path) {
        if (path == null || path.isBlank()) {
            return "/api/v1/static/p_default_img.png";
        }
        if (path.startsWith("http") || path.startsWith("/")) {
            return path;
        }
        return "/api/v1/static/" + path.replace("\\", "/");
    }

    /**
     * 현재 인증된 사용자 조회
     */
    private User resolveCurrentUser(String currentUserNick) {
        if (!StringUtils.hasText(currentUserNick)) {
            throw new AccessDeniedException("인증된 사용자만 접근할 수 있습니다.");
        }

        User user = userRepository.findByNick(currentUserNick);
        if (user == null) {
            throw new AccessDeniedException("사용자 정보를 찾을 수 없습니다.");
        }
        return user;
    }

    /**
     * 카테고리 조회
     */
    private Category resolveCategory(Integer categoryId) {
        if (categoryId == null) {
            throw new IllegalArgumentException("카테고리를 선택해 주세요.");
        }

        return categoryRepository.findById(categoryId.longValue())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 카테고리입니다."));
    }

    /**
     * Product 엔티티 생성 (PostService에서 이동)
     */
    private Product buildProductEntity(ProductDtos.CreateRequest request, User seller, Category category) {
        Product product = Product.builder()
                .price(toBigDecimal(request.getPrice()))
                .title(request.getTitle())
                .content(request.getContent())
                .status(ProductStatus.ON_SELL)
                .location_nm(request.getLocationNm())
                .latitude(toBigDecimal(request.getLatitude()))
                .longitude(toBigDecimal(request.getLongitude()))
                .view_count(0)
                .is_delete(false)
                .isResell(Boolean.TRUE.equals(request.getIsResell()))
                .seller(seller)
                .category(category)
                .images(new ArrayList<>())
                .build();

        // 이미지 엔티티 생성 (temp 폴더 경로)
        List<ProductImage> images = buildImageEntities(request.getImages(), product);
        product.getImages().addAll(images);

        return product;
    }

    /**
     * ProductImage 엔티티 리스트 생성
     */
    private List<ProductImage> buildImageEntities(List<ProductDtos.ImageItem> imageItems, Product product) {
        List<ProductImage> results = new ArrayList<>();
        if (CollectionUtils.isEmpty(imageItems)) {
            return results;
        }

        boolean hasMain = imageItems.stream().anyMatch(img -> Boolean.TRUE.equals(img.getIsMain()));

        for (int i = 0; i < imageItems.size(); i++) {
            ProductDtos.ImageItem item = imageItems.get(i);
            boolean isMain = Boolean.TRUE.equals(item.getIsMain());

            // 메인 이미지가 없으면 첫 번째를 메인으로 지정
            if (!hasMain && i == 0) {
                isMain = true;
            }

            ProductImage image = ProductImage.builder()
                    .path(item.getPath())  // temp 폴더 경로
                    .is_main(isMain)
                    .product(product)
                    .build();
            results.add(image);
        }

        return results;
    }

    /**
     * temp 폴더의 이미지를 products/{productId}/ 폴더로 이동
     */
    private void migrateImagesToProductFolder(Product product) {
        if (CollectionUtils.isEmpty(product.getImages())) {
            log.info("이미지가 없어 마이그레이션을 건너뜁니다: productId={}", product.getId());
            return;
        }

        for (ProductImage image : product.getImages()) {
            String tempPath = image.getPath();

            // 이미 절대 경로이거나 URL인 경우 건너뛰기
            if (tempPath == null || tempPath.startsWith("http") || tempPath.startsWith("/api/")) {
                continue;
            }

            try {
                // temp 폴더의 파일을 products/{productId}/ 폴더로 이동
                String newPath = fileStorageService.moveToProductFolder(
                    tempPath,
                    product.getId(),
                    image.getIs_main()
                );

                // DB에 새 경로 업데이트
                image.setPath(newPath);

                log.info("이미지 이동 완료: {} -> {}", tempPath, newPath);
            } catch (Exception e) {
                log.error("이미지 이동 실패: tempPath={}, productId={}", tempPath, product.getId(), e);
                // 이동 실패해도 계속 진행 (기존 경로 유지)
            }
        }
    }

    /**
     * Double을 BigDecimal로 변환
     */
    private BigDecimal toBigDecimal(Double value) {
        return value == null ? null : BigDecimal.valueOf(value);
    }
}
