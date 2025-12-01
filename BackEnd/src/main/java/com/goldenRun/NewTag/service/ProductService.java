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
import org.springframework.data.domain.PageImpl;
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
import java.util.Comparator;
import java.util.HashMap;
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
     * 상품 목록 조회
     */
    public Page<ProductDtos.ListItem> getProductList(Long categoryId, String sortBy, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, resolveSort(sortBy));
        Page<Product> products = (categoryId != null)
                ? productRepository.findByCategoryNotDeleted(categoryId, pageable)
                : productRepository.findAllNotDeleted(pageable);

        Map<Long, Long> favoriteCountMap = favoriteService.getFavoriteCounts(
                products.stream().map(Product::getId).toList()
        );

        List<ProductDtos.ListItem> items = products.stream()
                .map(p -> toListItem(p, favoriteCountMap))
                .toList();

        return new PageImpl<>(items, pageable, products.getTotalElements());
    }

    /**
     * 상품 상세 조회
     */
    public ProductDtos.DetailResponse getProductDetail(Long id, Long userId) {
        Product product = productRepository.findByIdWithFetchJoin(id);
        if (product == null || Boolean.TRUE.equals(product.getIs_delete())) {
            throw new IllegalArgumentException("상품을 찾을 수 없습니다.");
        }
        return toDetailResponse(product, userId);
    }

    public List<ProductDtos.ListItem> getRelatedProducts(Long id, int limit) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

        Page<Product> related = productRepository.findRelatedProducts(
                product.getCategory().getId(),
                product.getId(),
                PageRequest.of(0, limit)
        );

        Map<Long, Long> favoriteCountMap = favoriteService.getFavoriteCounts(
                related.stream().map(Product::getId).toList()
        );

        return related.stream()
                .map(p -> toListItem(p, favoriteCountMap))
                .toList();
    }

    public List<ProductDtos.ListItem> getOtherProductsBySeller(Long id, int limit) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

        Page<Product> others = productRepository.findOtherProductsBySeller(
                product.getSeller().getId(),
                product.getId(),
                PageRequest.of(0, limit)
        );

        Map<Long, Long> favoriteCountMap = favoriteService.getFavoriteCounts(
                others.stream().map(Product::getId).toList()
        );

        return others.stream()
                .map(p -> toListItem(p, favoriteCountMap))
                .toList();
    }

    @Transactional
    public Page<ProductDtos.ListItem> searchProducts(
            String keyword,
            Long userId,
            String deviceType,
            int page,
            int size
    ) {
        Pageable pageable = PageRequest.of(page, size, resolveSort("latest"));
        Page<Product> products = productRepository.searchByTitle(keyword, pageable);

        Map<Long, Long> favoriteCountMap = favoriteService.getFavoriteCounts(
                products.stream().map(Product::getId).toList()
        );

        List<ProductDtos.ListItem> items = products.stream()
                .map(p -> toListItem(p, favoriteCountMap))
                .toList();

        if (userId != null) {
            searchLogService.logSearch(userId, keyword, products.getNumberOfElements(), deviceType);
        }

        return new PageImpl<>(items, pageable, products.getTotalElements());
    }

    public Page<ProductDtos.ListItem> getProductsBySeller(Long sellerId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, resolveSort("latest"));
        Page<Product> products = productRepository.findBySellerNotDeleted(sellerId, pageable);

        Map<Long, Long> favoriteCountMap = favoriteService.getFavoriteCounts(
                products.stream().map(Product::getId).toList()
        );

        List<ProductDtos.ListItem> items = products.stream()
                .map(p -> toListItem(p, favoriteCountMap))
                .toList();

        return new PageImpl<>(items, pageable, products.getTotalElements());
    }

    public List<ProductDtos.ListItem> getProductsByLocation(Double latitude, Double longitude, Double radius) {
        if (latitude == null || longitude == null || radius == null) {
            throw new IllegalArgumentException("위도, 경도, 반경이 필요합니다.");
        }
        Page<Product> products = productRepository.findByLocation(
                latitude,
                longitude,
                radius,
                PageRequest.of(0, 50, resolveSort("latest"))
        );
        Map<Long, Long> favoriteCountMap = favoriteService.getFavoriteCounts(
                products.stream().map(Product::getId).toList()
        );
        return products.stream()
                .map(p -> toListItem(p, favoriteCountMap))
                .toList();
    }

    /**
     * 내 상품 목록
     */
    public List<ProductDtos.ListItem> getMyProducts(String currentUserNick) {
        User user = resolveCurrentUser(currentUserNick);
        List<Product> products = productRepository.findBySellerNotDeleted(
                user.getId(),
                PageRequest.of(0, 200, resolveSort("latest"))
        ).getContent();

        Map<Long, Long> favoriteCountMap = favoriteService.getFavoriteCounts(
                products.stream().map(Product::getId).toList()
        );

        return products.stream()
                .map(p -> toListItem(p, favoriteCountMap))
                .toList();
    }

    public long countActiveProductsBySeller(Long sellerId) {
        return productRepository.countActiveBySeller(sellerId);
    }

    /**
     * 상품 등록
     */
    @Transactional
    public ProductDtos.DetailResponse createProduct(ProductDtos.CreateRequest request, String currentUserNick) {
        if (request == null) {
            throw new IllegalArgumentException("요청 정보가 없습니다.");
        }

        User seller = resolveCurrentUser(currentUserNick);
        Category category = resolveCategory(request.getCategoryId());

        Product product = buildProductEntity(request, seller, category);
        productRepository.save(product);
        migrateImagesToProductFolder(product);
        productRepository.save(product);

        return toDetailResponse(product, seller.getId());
    }

    /**
     * 상품 수정
     */
    @Transactional
    public ProductDtos.DetailResponse updateProduct(Long id, ProductDtos.UpdateRequest request, String currentUserNick) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));
        User seller = resolveCurrentUser(currentUserNick);
        if (!product.getSeller().getId().equals(seller.getId())) {
            throw new AccessDeniedException("본인 상품만 수정할 수 있습니다.");
        }

        if (request.getPrice() != null) product.setPrice(toBigDecimal(request.getPrice()));
        if (StringUtils.hasText(request.getTitle())) product.setTitle(request.getTitle());
        if (StringUtils.hasText(request.getContent())) product.setContent(request.getContent());
        if (request.getStatus() != null) product.setStatus(request.getStatus());
        if (StringUtils.hasText(request.getLocationNm())) product.setLocation_nm(request.getLocationNm());
        if (request.getLatitude() != null) product.setLatitude(toBigDecimal(request.getLatitude()));
        if (request.getLongitude() != null) product.setLongitude(toBigDecimal(request.getLongitude()));
        if (request.getCategoryId() != null) {
            product.setCategory(resolveCategory(request.getCategoryId()));
        }

        return toDetailResponse(product, seller.getId());
    }

    /**
     * 상품 삭제 (소프트 삭제)
     */
    @Transactional
    public void deleteProduct(Long id, String currentUserNick) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));
        User seller = resolveCurrentUser(currentUserNick);
        if (!product.getSeller().getId().equals(seller.getId())) {
            throw new AccessDeniedException("본인 상품만 삭제할 수 있습니다.");
        }

        product.setIs_delete(true);
        product.setUpdatedAt(LocalDateTime.now());
    }

    /**
     * 상태 변경
     */
    @Transactional
    public ProductDtos.DetailResponse updateProductStatus(Long id, ProductStatus status, String currentUserNick) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));
        User seller = resolveCurrentUser(currentUserNick);
        if (!product.getSeller().getId().equals(seller.getId())) {
            throw new AccessDeniedException("본인 상품만 수정할 수 있습니다.");
        }
        product.setStatus(status);
        return toDetailResponse(product, seller.getId());
    }

    /**
     * 조회수 증가
     */
    @Transactional
    public void incrementViewCount(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));
        if (Boolean.TRUE.equals(product.getIs_delete())) {
            throw new IllegalArgumentException("삭제된 상품입니다.");
        }
        product.increaseView();
    }

    /**
     * 거래 완료 처리
     */
    @Transactional
    public ProductDtos.CompleteSaleResponse completeSale(Long id, Long buyerId, String currentUserNick) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));
        User seller = resolveCurrentUser(currentUserNick);
        if (!product.getSeller().getId().equals(seller.getId())) {
            throw new AccessDeniedException("본인 상품만 완료 처리할 수 있습니다.");
        }
        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new IllegalArgumentException("구매자를 찾을 수 없습니다."));

        product.setStatus(ProductStatus.SOLD_OUT);

        Transaction transaction = Transaction.builder()
                .product(product)
                .buyer(buyer)
                .seller(seller)
                .status(TransactionStatus.COMPLETED)
                .build();
        Transaction saved = transactionRepository.save(transaction);

        return ProductDtos.CompleteSaleResponse.builder()
                .product(toDetailResponse(product, buyerId))
                .transactionId(saved.getId())
                .build();
    }

    /**
     * Format elapsed time into a human-readable string.
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

    private String resolveThumbnailPath(String path) {
        if (path == null || path.isBlank()) {
            return resolveImagePath(null);
        }
        if (path.startsWith("http")) {
            return path;
        }

        String normalizedPath = path;
        int staticIndex = normalizedPath.indexOf("/static/");
        if (staticIndex >= 0) {
            normalizedPath = normalizedPath.substring(staticIndex + "/static/".length());
        } else if (normalizedPath.startsWith("static/")) {
            normalizedPath = normalizedPath.substring("static/".length());
        } else if (normalizedPath.startsWith("/static/")) {
            normalizedPath = normalizedPath.substring("/static/".length());
        }

        String thumbnailCandidate = fileStorageService.buildThumbnailPath(normalizedPath);
        if (thumbnailCandidate == null) {
            return resolveImagePath(path);
        }

        boolean isRelativePath = !thumbnailCandidate.startsWith("/") && !thumbnailCandidate.startsWith("http");
        boolean thumbnailExists = isRelativePath && fileStorageService.thumbnailExists(normalizedPath);
        if (!thumbnailExists && isRelativePath) {
            return resolveImagePath(path);
        }

        if (thumbnailCandidate.startsWith("/")) {
            return thumbnailCandidate;
        }

        return resolveImagePath(thumbnailCandidate);
    }

    /**
     * 인증 사용자 조회
     */
    private User resolveCurrentUser(String currentUserNick) {
        if (!StringUtils.hasText(currentUserNick)) {
            throw new AccessDeniedException("인증된 사용자만 접근 가능합니다.");
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
            throw new IllegalArgumentException("카테고리를 선택해 주세요");
        }

        return categoryRepository.findById(categoryId.longValue())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 카테고리입니다"));
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

            // 메인 이미지가 없으면 첫번째를 메인으로 지정
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
     * temp 폴더의 이미지가 products/{productId}/ 폴더로 이동
     */
    private void migrateImagesToProductFolder(Product product) {
        if (CollectionUtils.isEmpty(product.getImages())) {
            log.info("이미지가 없어 마이그레이션을 건너뜁니다 productId={}", product.getId());
            return;
        }

        for (ProductImage image : product.getImages()) {
            String tempPath = image.getPath();

            // 외부 경로거나 URL인 경우 건너뛰기
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

                // DB의 경로 업데이트
                image.setPath(newPath);

                log.info("이미지 이동 완료: {} -> {}", tempPath, newPath);
            } catch (Exception e) {
                log.error("이미지 이동 실패: tempPath={}, productId={}", tempPath, product.getId(), e);
                // 이동 실패여도 계속 진행 (기존 경로 유지)
            }
        }
    }

    /**
     * Double을 BigDecimal로 변환
     */
    private BigDecimal toBigDecimal(Double value) {
        return value == null ? null : BigDecimal.valueOf(value);
    }

    private Sort resolveSort(String sortBy) {
        if (!StringUtils.hasText(sortBy)) {
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }
        return switch (sortBy.toLowerCase()) {
            case "popular" -> Sort.by(Sort.Direction.DESC, "view_count");
            case "priceasc" -> Sort.by(Sort.Direction.ASC, "price");
            case "pricedesc" -> Sort.by(Sort.Direction.DESC, "price");
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };
    }

    private ProductDtos.ListItem toListItem(Product product, Map<Long, Long> favoriteCountMap) {
        String mainImagePath = resolveMainImage(product);
        return ProductDtos.ListItem.builder()
                .id(product.getId() != null ? product.getId().intValue() : null)
                .mainImage(mainImagePath)
                .thumbnailImage(resolveThumbnailPath(mainImagePath))
                .title(product.getTitle())
                .price(product.getPrice() != null ? product.getPrice().doubleValue() : null)
                .status(product.getStatus())
                .locationNm(product.getLocation_nm())
                .latitude(product.getLatitude() != null ? product.getLatitude().doubleValue() : null)
                .longitude(product.getLongitude() != null ? product.getLongitude().doubleValue() : null)
                .createdAt(product.getCreatedAt())
                .viewCount(product.getView_count())
                .favoriteCount(favoriteCountMap.getOrDefault(product.getId(), 0L))
                .timeAgo(product.getCreatedAt() != null ? getTimeAgo(product.getCreatedAt()) : null)
                .isResell(product.getIsResell())
                .seller(ProductDtos.SellerInfo.builder()
                        .id(product.getSeller() != null ? product.getSeller().getId().intValue() : null)
                        .nick(product.getSeller() != null ? product.getSeller().getNick() : null)
                        .name(product.getSeller() != null ? product.getSeller().getName() : null)
                        .build())
                .build();
    }

    private ProductDtos.DetailResponse toDetailResponse(Product product, Long requestUserId) {
        String mainImagePath = resolveMainImage(product);
        List<ProductImage> sortedImages = new ArrayList<>(product.getImages() == null ? List.of() : product.getImages());
        sortedImages.sort(Comparator.comparing(ProductImage::getIs_main).reversed());

        List<ProductDtos.ImageResponse> imageResponses = sortedImages.stream()
                .map(img -> ProductDtos.ImageResponse.builder()
                        .id(img.getId() != null ? img.getId().intValue() : null)
                        .pImg(resolveImagePath(img.getPath()))
                        .isMain(img.getIs_main())
                        .createdAt(img.getCreatedAt())
                        .updatedAt(img.getUpdatedAt())
                        .productId(product.getId() != null ? product.getId().intValue() : null)
                        .thumbnailPath(resolveThumbnailPath(img.getPath()))
                        .build())
                .toList();

        long favoriteCount = favoriteService.getFavoriteCount(product.getId());
        boolean likedByMe = requestUserId != null && favoriteService.isFavorite(product.getId(), requestUserId);

        Double sellerRating = reviewService.getAverageRating(product.getSeller().getId());
        Long sellerRatingCount = reviewService.getReviewCount(product.getSeller().getId());
        String sellerGrade = reviewService.calculateUserGrade(product.getSeller().getId());

        return ProductDtos.DetailResponse.builder()
                .id(product.getId() != null ? product.getId().intValue() : null)
                .title(product.getTitle())
                .price(product.getPrice() != null ? product.getPrice().doubleValue() : null)
                .content(product.getContent())
                .status(product.getStatus())
                .locationNm(product.getLocation_nm())
                .latitude(product.getLatitude() != null ? product.getLatitude().doubleValue() : null)
                .longitude(product.getLongitude() != null ? product.getLongitude().doubleValue() : null)
                .viewCount(product.getView_count())
                .favoriteCount(favoriteCount)
                .timeAgo(product.getCreatedAt() != null ? getTimeAgo(product.getCreatedAt()) : null)
                .createdAt(product.getCreatedAt())
                .categoryId(product.getCategory() != null ? product.getCategory().getId().intValue() : null)
                .images(imageResponses)
                .mainImage(resolveImagePath(mainImagePath))
                .sellerId(product.getSeller() != null ? product.getSeller().getId().intValue() : null)
                .sellerName(product.getSeller() != null ? product.getSeller().getName() : null)
                .sellerNick(product.getSeller() != null ? product.getSeller().getNick() : null)
                .sellerProfileImg(product.getSeller() != null ? product.getSeller().getProfileImg() : null)
                .sellerRatingAvg(sellerRating)
                .sellerRatingCount(sellerRatingCount)
                .sellerGrade(sellerGrade)
                .likedByMe(likedByMe)
                .isResell(product.getIsResell())
                .build();
    }

    private String resolveMainImage(Product product) {
        if (product.getImages() == null || product.getImages().isEmpty()) {
            return null;
        }
        return product.getImages().stream()
                .sorted(Comparator.comparing(ProductImage::getIs_main).reversed())
                .map(ProductImage::getPath)
                .findFirst()
                .orElse(null);
    }

    /**
     * 90일 이상 소프트삭제된 상품 자동 정리
     */
    @Transactional
    public int cleanupOldDeletedProducts() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(90);
        List<Product> oldProducts = productRepository.findByIsDeleteTrueAndUpdatedAtBefore(cutoff);

        if (oldProducts.isEmpty()) {
            log.info("정리 대상이 되는 상품이 없습니다.");
            return 0;
        }

        int deletedCount = 0;
        for (Product product : oldProducts) {
            try {
                // 1. 관련 이미지 파일 삭제
                if (product.getImages() != null && !product.getImages().isEmpty()) {
                    for (ProductImage image : product.getImages()) {
                        try {
                            fileStorageService.deleteFile(image.getPath());
                            log.debug("이미지 파일 삭제 완료: {}", image.getPath());
                        } catch (Exception e) {
                            log.warn("이미지 파일 삭제 실패: path={}, error={}", image.getPath(), e.getMessage());
                        }
                    }
                }

                // 2. DB에서 상품 영구 삭제 (CASCADE로 관련 이미지도 함께 삭제)
                productRepository.delete(product);
                deletedCount++;

                log.info("상품 영구 삭제 완료: productId={}, title={}, deletedAt={}",
                        product.getId(), product.getTitle(), product.getUpdatedAt());
            } catch (Exception e) {
                log.error("상품 삭제 중 오류 발생: productId={}, error={}",
                        product.getId(), e.getMessage(), e);
            }
        }

        log.info("자동 정리 배치 작업 완료: 총 {}개의 상품 삭제", deletedCount);
        return deletedCount;
    }
}
