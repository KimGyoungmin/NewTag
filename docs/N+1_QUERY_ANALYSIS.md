# N+1 쿼리 문제 분석 및 최적화 방안

## 📊 분석 일시
- **작성일**: 2025-11-25
- **분석 대상**: ProductService.java
- **분석자**: Claude Code (Gemini Daily 분석 액션 아이템)

---

## 🔍 현재 상태 분석

### 1. **이미 최적화된 부분** ✅

#### 1.1 Favorite Count 조회 최적화
**위치**: ProductService.java Line 68-76

```java
// 모든 상품의 ID를 수집
List<Long> productIds = products.getContent().stream()
        .map(Product::getId)
        .collect(Collectors.toList());

// 한 번의 쿼리로 모든 상품의 찜 개수 조회 (N+1 문제 해결)
Map<Long, Long> favoriteCountMap = favoriteService.getFavoriteCounts(productIds);

return products.map(product -> convertToListItem(product, favoriteCountMap));
```

**최적화 효과**:
- **Before**: N개 상품 → N번의 Favorite 개수 조회 쿼리 = **1 + N개 쿼리**
- **After**: 1번의 배치 쿼리로 모든 Favorite 개수 조회 = **2개 쿼리**
- **개선율**: 90% 이상 (N=100일 경우)

**적용 범위**:
- `getProductList()` - Line 68-76
- `getProductsBySeller()` - Line 105-112
- `searchProducts()` - Line 135-142
- `getRelatedProducts()` - Line 166-173
- `getOtherProductsBySeller()` - Line 197-204

---

### 2. **잠재적 N+1 문제** ⚠️

#### 2.1 Product → Seller 조회 (LAZY Loading)
**위치**: Product.java Line 51-52

```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name="seller_id", nullable=false)
private User seller;
```

**문제 발생 시점**:
- `convertToListItem()` 메서드에서 `product.getSeller()` 접근 시 (Line 352-358)
- `convertToDetailResponse()` 메서드에서 판매자 정보 접근 시 (Line 453-479)

**쿼리 패턴**:
```sql
-- 1. Product 목록 조회
SELECT * FROM product WHERE is_delete = false LIMIT 20;

-- 2. 각 Product마다 Seller 조회 (N+1 발생)
SELECT * FROM user WHERE id = 1;  -- Product 1의 seller
SELECT * FROM user WHERE id = 2;  -- Product 2의 seller
SELECT * FROM user WHERE id = 3;  -- Product 3의 seller
...
```

**영향도**: 🔴 **높음**
- 모든 상품 목록 조회 시 발생
- 페이지당 20~30개 상품 → 20~30번의 추가 쿼리

#### 2.2 Product → Category 조회 (LAZY Loading)
**위치**: Product.java Line 54-55

```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name="category_id", nullable=false)
private Category category;
```

**문제 발생 시점**:
- `convertToDetailResponse()` 메서드에서 `product.getCategory().getId()` 접근 시 (Line 470)
- `getRelatedProducts()` 메서드에서 `baseProduct.getCategory()` 접근 시 (Line 152)

**영향도**: 🟡 **중간**
- DetailResponse에서만 발생
- ListItem에서는 categoryId를 직접 조회하지 않음

#### 2.3 Product → Images 조회 (LAZY Loading)
**위치**: Product.java Line 57-59

```java
@OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
@Builder.Default
private List<ProductImage> images = new ArrayList<>();
```

**문제 발생 시점**:
- `convertToListItem()` 메서드에서 메인 이미지 추출 시 (Line 336-345)
- `convertToDetailResponse()` 메서드에서 모든 이미지 조회 시 (Line 428-442)

**쿼리 패턴**:
```sql
-- 1. Product 목록 조회
SELECT * FROM product WHERE is_delete = false LIMIT 20;

-- 2. 각 Product마다 Images 조회 (N+1 발생)
SELECT * FROM product_image WHERE product_id = 1;
SELECT * FROM product_image WHERE product_id = 2;
SELECT * FROM product_image WHERE product_id = 3;
...
```

**영향도**: 🔴 **높음**
- 모든 상품 목록/상세 조회 시 발생
- 가장 빈번하게 발생하는 N+1 문제

#### 2.4 Review 서비스 조회
**위치**: ProductService.java Line 453-456

```java
Long sellerId = product.getSeller().getId();
double sellerRatingAvg = reviewService.getAverageRating(sellerId);
long sellerRatingCount = reviewService.getReviewCount(sellerId);
```

**문제**: 상세 조회 시마다 2번의 Review 쿼리 추가 실행

**영향도**: 🟡 **중간**
- 상세 조회에서만 발생
- 목록 조회에는 영향 없음

---

## 💡 최적화 방안

### 방안 1: Fetch Join 사용 (권장) ⭐⭐⭐⭐⭐

#### 1.1 Repository 쿼리 수정

**Before** (ProductRepository.java):
```java
@Query("SELECT p FROM Product p WHERE p.is_delete = false")
Page<Product> findAllNotDeleted(Pageable pageable);
```

**After**:
```java
@Query("SELECT DISTINCT p FROM Product p " +
       "LEFT JOIN FETCH p.seller " +
       "LEFT JOIN FETCH p.category " +
       "LEFT JOIN FETCH p.images " +
       "WHERE p.is_delete = false")
Page<Product> findAllNotDeletedWithDetails(Pageable pageable);
```

**장점**:
- ✅ 1번의 쿼리로 Product + Seller + Category + Images 모두 조회
- ✅ LAZY Loading 시 발생하는 추가 쿼리 완전 제거
- ✅ 성능 대폭 향상 (특히 대량 데이터)

**단점**:
- ⚠️ 페이징 처리 시 메모리에서 중복 제거 필요 (DISTINCT)
- ⚠️ OneToMany 관계 때문에 데이터 중복 발생 가능

**해결 방법**:
```java
@Query(value = "SELECT DISTINCT p FROM Product p " +
               "LEFT JOIN FETCH p.seller " +
               "LEFT JOIN FETCH p.category " +
               "WHERE p.is_delete = false",
       countQuery = "SELECT COUNT(p) FROM Product p WHERE p.is_delete = false")
Page<Product> findAllNotDeletedWithDetails(Pageable pageable);

// Images는 별도 쿼리로 조회 (중복 방지)
@Query("SELECT p FROM Product p " +
       "LEFT JOIN FETCH p.images " +
       "WHERE p IN :products")
List<Product> fetchImages(@Param("products") List<Product> products);
```

#### 1.2 적용 예시

**ProductService.java 수정**:
```java
public Page<ProductDtos.ListItem> getProductList(
        Long categoryId,
        String sortBy,
        int page,
        int size
) {
    Pageable pageable = createPageable(sortBy, page, size);

    Page<Product> products;
    if (categoryId != null && categoryId > 0) {
        // Seller, Category Fetch Join
        products = productRepository.findByCategoryNotDeletedWithDetails(categoryId, pageable);
    } else {
        products = productRepository.findAllNotDeletedWithDetails(pageable);
    }

    // Images 별도 조회 (페이징 후)
    List<Product> productList = products.getContent();
    if (!productList.isEmpty()) {
        productRepository.fetchImages(productList);
    }

    // Favorite count 배치 조회 (기존 최적화 유지)
    List<Long> productIds = productList.stream()
            .map(Product::getId)
            .collect(Collectors.toList());
    Map<Long, Long> favoriteCountMap = favoriteService.getFavoriteCounts(productIds);

    return products.map(product -> convertToListItem(product, favoriteCountMap));
}
```

---

### 방안 2: Entity Graph 사용 ⭐⭐⭐⭐

**ProductRepository.java에 추가**:
```java
@EntityGraph(attributePaths = {"seller", "category", "images"})
@Query("SELECT p FROM Product p WHERE p.is_delete = false")
Page<Product> findAllNotDeletedWithGraph(Pageable pageable);
```

**장점**:
- ✅ 간결한 코드
- ✅ Fetch Join과 동일한 효과
- ✅ 동적으로 필요한 연관 관계만 선택 가능

**단점**:
- ⚠️ OneToMany 관계 시 중복 데이터 문제 동일

---

### 방안 3: DTO 직접 조회 (Best Performance) ⭐⭐⭐⭐⭐

#### 3.1 Native Query + DTO Projection

**ProductRepository.java에 추가**:
```java
@Query("SELECT new com.goldenRun.NewTag.dto.ProductDtos$ListItemProjection(" +
       "p.id, p.title, p.price, p.location_nm, p.latitude, p.longitude, " +
       "p.createdAt, p.view_count, p.isResell, " +
       "s.id, s.nick, s.name, " +
       "c.id, c.categoryNm) " +
       "FROM Product p " +
       "JOIN p.seller s " +
       "JOIN p.category c " +
       "WHERE p.is_delete = false")
Page<ProductDtos.ListItemProjection> findAllNotDeletedAsDto(Pageable pageable);
```

**ProductDtos.java에 추가**:
```java
@Getter
@AllArgsConstructor
public static class ListItemProjection {
    private Long productId;
    private String title;
    private BigDecimal price;
    private String locationNm;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private LocalDateTime createdAt;
    private Integer viewCount;
    private Boolean isResell;

    private Long sellerId;
    private String sellerNick;
    private String sellerName;

    private Long categoryId;
    private String categoryName;
}
```

**장점**:
- ✅ **최고의 성능** - 필요한 컬럼만 SELECT
- ✅ 메모리 효율적
- ✅ N+1 문제 완전 제거
- ✅ 중복 데이터 문제 없음

**단점**:
- ⚠️ DTO 클래스 추가 필요
- ⚠️ 이미지는 별도 조회 필요

#### 3.2 이미지 배치 조회

**ProductRepository.java에 추가**:
```java
@Query("SELECT pi FROM ProductImage pi " +
       "WHERE pi.product.id IN :productIds " +
       "ORDER BY pi.is_main DESC, pi.id ASC")
List<ProductImage> findImagesByProductIds(@Param("productIds") List<Long> productIds);
```

**ProductService.java에서 사용**:
```java
public Page<ProductDtos.ListItem> getProductList(...) {
    // 1. DTO로 상품 기본 정보 조회
    Page<ProductDtos.ListItemProjection> projections =
        productRepository.findAllNotDeletedAsDto(pageable);

    List<Long> productIds = projections.getContent().stream()
            .map(ProductDtos.ListItemProjection::getProductId)
            .collect(Collectors.toList());

    // 2. 이미지 배치 조회
    List<ProductImage> images = productRepository.findImagesByProductIds(productIds);
    Map<Long, String> mainImageMap = images.stream()
            .filter(ProductImage::getIs_main)
            .collect(Collectors.toMap(
                img -> img.getProduct().getId(),
                ProductImage::getPath,
                (existing, replacement) -> existing
            ));

    // 3. Favorite 배치 조회 (기존)
    Map<Long, Long> favoriteCountMap = favoriteService.getFavoriteCounts(productIds);

    // 4. DTO 조합
    return projections.map(proj -> convertProjectionToListItem(
        proj, mainImageMap, favoriteCountMap
    ));
}
```

---

### 방안 4: 배치 크기 조정 (Hibernate 설정)

**application.properties에 추가**:
```properties
# Batch Size 설정 (N+1 문제 완화)
spring.jpa.properties.hibernate.default_batch_fetch_size=100

# SQL 로깅 (개발 환경에서 쿼리 확인용)
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
logging.level.org.hibernate.SQL=DEBUG
logging.level.org.hibernate.type.descriptor.sql.BasicBinder=TRACE
```

**효과**:
- N+1 쿼리를 완전히 제거하지는 못하지만
- N번의 개별 쿼리 → ⌈N/100⌉번의 IN 쿼리로 개선
- 예: 1000개 상품 → 1번(Product) + 10번(Seller IN 쿼리) + 10번(Images IN 쿼리) = 21개 쿼리

---

## 🎯 권장 적용 순서

### Phase 1: 즉시 적용 가능 (Breaking Change 없음)

1. **Batch Fetch Size 설정** (application.properties)
   - 시간: 1분
   - 효과: 중간
   - 리스크: 없음

2. **Favorite Count 최적화 유지**
   - 현재 상태: 이미 최적화됨 ✅
   - 추가 작업: 없음

### Phase 2: Repository 메서드 추가 (기존 코드 영향 없음)

3. **Fetch Join 적용된 새 메서드 추가**
   - `findAllNotDeletedWithDetails()`
   - `findByCategoryNotDeletedWithDetails()`
   - `findBySellerNotDeletedWithDetails()`
   - 시간: 30분
   - 효과: 높음
   - 리스크: 낮음 (기존 메서드 유지)

### Phase 3: 서비스 레이어 전환

4. **ProductService에서 새 메서드 사용**
   - 기존 메서드를 점진적으로 전환
   - A/B 테스트 가능
   - 시간: 1시간
   - 효과: 매우 높음

### Phase 4: 고급 최적화 (선택)

5. **DTO Projection 도입**
   - 트래픽이 많은 API부터 적용
   - 시간: 2-3시간
   - 효과: 최고
   - 리스크: 중간 (DTO 관리 필요)

---

## 📈 예상 성능 개선

### Before (현재 상태)
**상품 목록 20개 조회 시**:
```
1. Product 목록 조회: 1 query
2. Seller 조회 (N+1): 20 queries
3. Category 조회 (N+1): 20 queries
4. Images 조회 (N+1): 20 queries
5. Favorite 배치 조회: 1 query (이미 최적화됨 ✅)
----------------------------------------
총 쿼리 수: 62개
응답 시간: ~300ms (예상)
```

### After (방안 3 적용 시)
```
1. Product + Seller + Category DTO 조회: 1 query
2. Images 배치 조회: 1 query
3. Favorite 배치 조회: 1 query
----------------------------------------
총 쿼리 수: 3개
응답 시간: ~50ms (예상)
```

**개선율**:
- 쿼리 수: **95% 감소** (62개 → 3개)
- 응답 시간: **83% 개선** (300ms → 50ms)

---

## 🛠 구현 우선순위

| 순위 | 작업 | 난이도 | 효과 | 예상 시간 |
|------|------|--------|------|-----------|
| 1 | Batch Fetch Size 설정 | ⭐ | ⭐⭐⭐ | 1분 |
| 2 | Fetch Join 메서드 추가 | ⭐⭐ | ⭐⭐⭐⭐ | 30분 |
| 3 | 서비스 레이어 전환 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 1시간 |
| 4 | DTO Projection 도입 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 2-3시간 |

---

## 📝 다음 단계

1. ✅ N+1 문제 분석 완료
2. 🔄 Batch Fetch Size 설정 적용 (즉시 가능)
3. ⏳ Fetch Join 메서드 작성 및 테스트
4. ⏳ 성능 테스트 및 비교
5. ⏳ 프로덕션 배포

---

## 📚 참고 자료

- [Hibernate Batch Fetching](https://docs.jboss.org/hibernate/orm/5.4/userguide/html_single/Hibernate_User_Guide.html#fetching-batch)
- [JPA Fetch Join](https://docs.oracle.com/javaee/7/tutorial/persistence-querylanguage004.htm#BNBRM)
- [DTO Projection Performance](https://vladmihalcea.com/the-best-way-to-map-a-projection-query-to-a-dto-with-jpa-and-hibernate/)

---

**작성자**: Claude Code
**검토 필요**: Backend 팀
**마지막 수정**: 2025-11-25
