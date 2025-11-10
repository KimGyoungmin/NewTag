# 상품 목록 DB 연동 완료 문서

## 📋 개요

메인 홈페이지의 상품 목록을 Mock 데이터에서 실제 DB 데이터로 전환하였으며, 검색 로그 기능도 함께 구현하였습니다.

## 🎯 구현 사항

### 1. BackEnd 구현

#### 1.1 엔티티 (Entity)

##### SearchLog 엔티티 생성
- **파일**: `BackEnd/src/main/java/com/goldenRun/NewTag/entity/SearchLog.java`
- **기능**: 사용자 검색 로그 저장
- **필드**:
  - `keyword`: 검색어
  - `result_count`: 검색 결과 개수
  - `clicked_at`: 상품 클릭 시간
  - `device_type`: 디바이스 타입 (PC, MOBILE, TABLET, UNKNOWN)
  - `clicked_product`: 클릭한 상품
  - `user`: 검색한 사용자

##### DeviceType Enum 생성
- **파일**: `BackEnd/src/main/java/com/goldenRun/NewTag/enums/DeviceType.java`
- **값**: `PC`, `MOBILE`, `TABLET`, `UNKNOWN`

#### 1.2 리포지토리 (Repository)

##### ProductRepository
- **파일**: `BackEnd/src/main/java/com/goldenRun/NewTag/Repository/ProductRepository.java`
- **주요 메서드**:
  - `findByIsDeleteFalse()`: 삭제되지 않은 상품 조회
  - `findByCategoryIdAndIsDeleteFalse()`: 카테고리별 상품 조회
  - `searchByTitle()`: 제목으로 상품 검색
  - `findByLocation()`: 위치 기반 상품 검색

##### SearchLogRepository
- **파일**: `BackEnd/src/main/java/com/goldenRun/NewTag/Repository/SearchLogRepository.java`
- **주요 메서드**:
  - `findByUserIdOrderByCreatedAtDesc()`: 사용자별 검색 로그 조회
  - `findPopularKeywords()`: 인기 검색어 조회
  - `findRecentKeywordsByUser()`: 사용자별 최근 검색어 조회

#### 1.3 서비스 (Service)

##### ProductService
- **파일**: `BackEnd/src/main/java/com/goldenRun/NewTag/service/ProductService.java`
- **주요 메서드**:
  ```java
  // 상품 목록 조회 (페이징, 정렬, 필터링)
  public Page<ProductDtos.ListItem> getProductList(
      Long categoryId, String sortBy, int page, int size
  )

  // 상품 상세 조회 (조회수 자동 증가)
  public ProductDtos.DetailResponse getProductDetail(Long productId, Long currentUserId)

  // 상품 검색 (검색 로그 자동 저장)
  public Page<ProductDtos.ListItem> searchProducts(
      String keyword, Long userId, String deviceType, int page, int size
  )

  // 판매자별 상품 조회
  public Page<ProductDtos.ListItem> getProductsBySeller(Long sellerId, int page, int size)
  ```

##### SearchLogService
- **파일**: `BackEnd/src/main/java/com/goldenRun/NewTag/service/SearchLogService.java`
- **주요 메서드**:
  ```java
  // 검색 로그 저장
  public void logSearch(Long userId, String keyword, int resultCount, String deviceType)

  // 상품 클릭 로그 업데이트
  public void logProductClick(Long searchLogId, Long productId)

  // 사용자별 최근 검색어 조회
  public List<String> getRecentKeywords(Long userId, int limit)

  // 인기 검색어 조회 (최근 7일)
  public List<String> getPopularKeywords(int limit)
  ```

#### 1.4 컨트롤러 (Controller)

##### ProductController
- **파일**: `BackEnd/src/main/java/com/goldenRun/NewTag/controller/ProductController.java`
- **API 엔드포인트**:

| Method | Endpoint | 설명 | 파라미터 |
|--------|----------|------|----------|
| GET | `/api/v1/products` | 상품 목록 조회 | categoryId, sortBy, page, size |
| GET | `/api/v1/products/{id}` | 상품 상세 조회 | userId (optional) |
| GET | `/api/v1/products/search` | 상품 검색 | keyword, userId, deviceType, page, size |
| GET | `/api/v1/products/seller/{sellerId}` | 판매자별 상품 조회 | page, size |
| GET | `/api/v1/products/search/popular` | 인기 검색어 조회 | limit |
| GET | `/api/v1/products/search/recent` | 최근 검색어 조회 | userId, limit |

### 2. FrontEnd 구현

#### 2.1 API 클라이언트 업데이트

##### products.ts
- **파일**: `FrontEnd/NewTag/src/api/products.ts`
- **주요 함수**:
  ```typescript
  // 상품 목록 조회
  getProducts(params?: {
    page?: number;
    size?: number;
    categoryId?: number;
    sortBy?: string;
  })

  // 상품 검색 (검색 로그 자동 저장)
  searchProducts(keyword, userId, deviceType, page, size)

  // 인기 검색어 조회
  getPopularKeywords(limit)

  // 최근 검색어 조회
  getRecentKeywords(userId, limit)
  ```

#### 2.2 HomePage 수정

##### HomePage.tsx
- **파일**: `FrontEnd/NewTag/src/pages/HomePage.tsx`
- **변경사항**:
  - Mock 데이터(`localStorage`) 제거
  - 실제 API 호출로 변경
  - Loading 및 Error 상태 처리 추가
  - 카테고리/정렬 변경 시 자동 재조회

```typescript
const fetchProducts = async () => {
  const response = await productsApi.getProducts({
    categoryId,
    sortBy,
    page: 0,
    size: 100,
  });
  setProducts(response.products || []);
};

useEffect(() => {
  fetchProducts();
}, [selectedCategory, sortBy]);
```

#### 2.3 CategoryFilter 수정

##### CategoryFilter.tsx
- **파일**: `FrontEnd/NewTag/src/components/CategoryFilter.tsx`
- **변경사항**: 카테고리 ID를 DB ID에 맞춰 변경
  - `'all'` → 전체
  - `'1'` → 전자기기
  - `'2'` → 가구/인테리어
  - `'3'` → 의류잡화
  - `'4'` → 스포츠/레저
  - `'5'` → 도서

## 🔍 주요 기능

### 1. 상품 목록 조회
- 페이징 지원 (기본 20개씩)
- 카테고리별 필터링
- 정렬 옵션:
  - `latest`: 최신순 (기본)
  - `price-low`: 가격 낮은순
  - `price-high`: 가격 높은순
  - `popular`: 인기순 (조회수 기준)

### 2. 검색 로그 자동 저장
- 사용자가 검색할 때마다 자동으로 `search_log` 테이블에 저장
- 저장 정보:
  - 검색어
  - 검색 결과 개수
  - 사용자 ID
  - 디바이스 타입
  - 검색 시간

### 3. 인기/최근 검색어
- 인기 검색어: 최근 7일간 검색 빈도 기준
- 최근 검색어: 사용자별 최근 검색 기록

## 📊 데이터 흐름

```
사용자 (FrontEnd)
    ↓
HomePage 컴포넌트
    ↓
productsApi.getProducts() 호출
    ↓
GET /api/v1/products?categoryId=1&sortBy=latest
    ↓
ProductController
    ↓
ProductService
    ↓
ProductRepository (JPA)
    ↓
MySQL Database
    ↓
Product 엔티티 → ProductDtos.ListItem 변환
    ↓
JSON 응답 반환
    ↓
FrontEnd에서 렌더링
```

## 🧪 테스트 방법

### 1. BackEnd 실행
```bash
cd BackEnd
./mvnw spring-boot:run
```

### 2. FrontEnd 실행
```bash
cd FrontEnd/NewTag
npm install
npm run dev
```

### 3. 브라우저에서 확인
- URL: `http://localhost:5173`
- 로그인 후 홈 화면에서 상품 목록 확인
- 카테고리 필터 클릭
- 정렬 옵션 변경
- 브라우저 개발자 도구에서 Network 탭 확인

### 4. API 직접 테스트
```bash
# 상품 목록 조회
curl "http://localhost:8080/api/v1/products?page=0&size=20"

# 카테고리별 조회 (전자기기)
curl "http://localhost:8080/api/v1/products?categoryId=1&sortBy=latest"

# 상품 검색
curl "http://localhost:8080/api/v1/products/search?keyword=아이폰&userId=3"

# 인기 검색어
curl "http://localhost:8080/api/v1/products/search/popular?limit=10"
```

## 🔧 설정 사항

### 1. CORS 설정
ProductController에 CORS 설정 추가:
```java
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"},
             allowCredentials = "true")
```

### 2. API Base URL
`.env` 파일 확인:
```
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

## 📝 DB 스키마

### product 테이블
```sql
CREATE TABLE product (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  price       DOUBLE NOT NULL,
  title       VARCHAR(100) NOT NULL,
  content     TEXT NOT NULL,
  status      ENUM('ON_SELL','SOLD_OUT','RESERVED') DEFAULT 'ON_SELL',
  location_nm VARCHAR(100) NOT NULL,
  latitude    DECIMAL(10, 7) NOT NULL,
  longitude   DECIMAL(10, 7) NOT NULL,
  view_count  INT DEFAULT 0,
  is_delete   BOOLEAN DEFAULT FALSE,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  seller_id   INT NOT NULL,
  category_id INT NOT NULL
);
```

### search_log 테이블
```sql
CREATE TABLE search_log (
  id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
  keyword             VARCHAR(200) NOT NULL,
  result_count        INT DEFAULT 0,
  clicked_at          DATETIME NULL,
  device_type         ENUM('PC', 'MOBILE', 'TABLET', 'UNKNOWN'),
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  clicked_product_id  BIGINT NULL,
  user_id             BIGINT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES user(id),
  FOREIGN KEY (clicked_product_id) REFERENCES product(id)
);
```

## 🎨 UI/UX 개선사항

### 1. Loading 상태
- 상품 로딩 중 "상품을 불러오는 중..." 메시지 표시

### 2. Error 상태
- API 오류 시 에러 메시지와 "다시 시도" 버튼 표시

### 3. Empty 상태
- 상품이 없을 때 "등록된 상품이 없습니다." 메시지 표시

## ⚠️ 주의사항

### 1. 인증 필요
- 현재 로그인한 사용자만 홈페이지 진입 가능
- 로그인 정보는 `localStorage`의 `auth_token`에 저장

### 2. 더미 데이터
- `PRODUCT_DUMMY_DATA.sql` 파일을 실행하여 테스트 데이터 생성
- 49개 상품 데이터 포함 (당근마켓 크롤링 데이터)

### 3. 카테고리 매핑
```
1 → 전자기기
2 → 가구/인테리어
3 → 의류잡화
4 → 스포츠/레저
5 → 도서
```

## 🚀 다음 단계

### 1. 추가 구현 필요 사항
- [ ] 찜하기(Favorite) 기능 연동
- [ ] 무한 스크롤 페이징
- [ ] 위치 기반 필터링
- [ ] 상품 상세 페이지 DB 연동
- [ ] 상품 등록 기능
- [ ] 검색 페이지 구현

### 2. 성능 최적화
- [ ] Redis 캐싱 적용
- [ ] 이미지 CDN 적용
- [ ] API 응답 캐싱

### 3. 보안
- [ ] JWT 토큰 검증 강화
- [ ] 검색 로그 개인정보 처리
- [ ] XSS/CSRF 방어

## 📚 참고 자료

- DDL.sql: 데이터베이스 스키마 정의
- PRODUCT_DUMMY_DATA.sql: 더미 데이터
- INTEGRATION_COMPLETE.md: API 연동 가이드
- README.md: 프로젝트 전체 설명
