# ProductService 통합 및 이미지 저장 구조 개선

## 📌 개요

PostController/PostService를 ProductController/ProductService로 통합하고, 이미지 저장 구조를 개선했습니다.

## 🔄 주요 변경사항

### 1. Controller 통합

**삭제된 파일**:
- `PostController.java` ❌
- `PostService.java` ❌
- `PostDtos.java` ❌

**통합된 위치**:
- `ProductController.java` ✅
- `ProductService.java` ✅
- `ProductDtos.java` ✅ (기존 사용)

### 2. API 엔드포인트

모든 상품 관련 API가 `/api/v1/products`로 통일되었습니다:

| Method | Endpoint | 설명 | 변경사항 |
|--------|----------|------|---------|
| GET | `/api/v1/products` | 상품 목록 조회 | 기존 유지 |
| GET | `/api/v1/products/{id}` | 상품 상세 조회 | 기존 유지 |
| POST | `/api/v1/products` | 상품 등록 | ✨ **새로 추가** |
| DELETE | `/api/v1/products/{id}` | 상품 삭제 (소프트) | ✨ **새로 추가** |
| PATCH | `/api/v1/products/{id}/status` | 상품 상태 변경 | 기존 유지 |
| GET | `/api/v1/products/search` | 상품 검색 | 기존 유지 |
| GET | `/api/v1/products/seller/{sellerId}` | 판매자별 상품 조회 | 기존 유지 |

### 3. 이미지 저장 구조

#### 변경 전
```
NewTag/static/uploads/
└── product_imgs/
    ├── temp/
    │   └── random_filename.jpg
    └── (모든 이미지가 한 폴더에 섞임)
```

#### 변경 후
```
BackEnd/src/main/resources/static/
└── products/
    ├── temp/                    # 상품 등록 전 임시 저장
    │   └── sub_abc12345.jpg
    ├── 1/                       # 상품 ID 1
    │   ├── main.jpg            # 메인 이미지
    │   ├── sub_abc12345.jpg    # 서브 이미지 1
    │   └── sub_def67890.jpg    # 서브 이미지 2
    └── 2/                       # 상품 ID 2
        ├── main.jpg
        └── sub_ghi11223.jpg
```

**이미지 URL 예시**:
- 메인 이미지: `/api/v1/static/products/1/main.jpg`
- 서브 이미지: `/api/v1/static/products/1/sub_abc12345.jpg`

### 4. 이미지 처리 플로우

```
1️⃣ 이미지 업로드
   POST /api/v1/uploads/images
   → FileStorageService.store()
   → products/temp/sub_random.jpg 저장
   → 경로 반환: "products/temp/sub_random.jpg"

2️⃣ 상품 등록
   POST /api/v1/products
   request body: {
     images: [{ path: "products/temp/sub_random.jpg", isMain: true }]
   }
   → ProductService.createProduct()
   → Product 엔티티 저장 (이미지 경로: temp)
   → migrateImagesToProductFolder() 호출
   → products/temp/sub_random.jpg → products/{productId}/main.jpg 이동
   → DB 경로 업데이트: "products/{productId}/main.jpg"
```

## 📁 코드 변경 세부사항

### ProductService.java

#### 추가된 메서드:

**1. createProduct()**
```java
@Transactional
public ProductDtos.DetailResponse createProduct(
    ProductDtos.CreateRequest request,
    String currentUserNick
)
```
- 상품 엔티티 생성
- DB 저장
- **이미지 마이그레이션 (temp → products/{id}/)**
- DetailResponse 반환

**2. deleteProduct()**
```java
@Transactional
public void deleteProduct(Long productId, String currentUserNick)
```
- 소프트 삭제 (`is_delete = true`)
- 권한 검증 (본인 상품만)

**3. migrateImagesToProductFolder()**
```java
private void migrateImagesToProductFolder(Product product)
```
- temp 폴더 → products/{productId}/ 이동
- 메인 이미지: `main.jpg`
- 서브 이미지: `sub_{random}.jpg`
- DB 경로 자동 업데이트
- 에러 발생 시 로깅 후 계속 진행

**4. 헬퍼 메서드들**:
- `resolveCurrentUser()` - 사용자 인증 확인
- `resolveCategory()` - 카테고리 조회
- `buildProductEntity()` - Product 엔티티 생성
- `buildImageEntities()` - ProductImage 엔티티 리스트 생성
- `toBigDecimal()` - 타입 변환

### ProductController.java

#### 추가된 엔드포인트:

```java
@PostMapping
public ResponseEntity<ProductDtos.DetailResponse> createProduct(
    @RequestBody ProductDtos.CreateRequest request,
    @AuthenticationPrincipal String currentUserNick
)

@DeleteMapping("/{id}")
public ResponseEntity<Map<String, Object>> deleteProduct(
    @PathVariable Long id,
    @AuthenticationPrincipal String currentUserNick
)
```

### FileStorageService.java

이미 구현된 메서드 사용:
- `store()` - temp 폴더에 저장
- `storeProductImage()` - product 폴더에 저장
- `moveToProductFolder()` - temp → product 이동
- `deleteProductFolder()` - 상품 폴더 삭제

## 🧪 테스트 가이드

### 1. 이미지 업로드 테스트

```bash
# 1. 이미지 업로드 (temp 폴더)
curl -X POST http://localhost:8080/api/v1/uploads/images \
  -H "Authorization: Bearer {token}" \
  -F "file=@test.jpg"

# Response:
{
  "success": true,
  "path": "products/temp/sub_abc12345.jpg",
  "url": "/api/v1/static/products/temp/sub_abc12345.jpg"
}
```

### 2. 상품 등록 테스트

```bash
# 2. 상품 등록
curl -X POST http://localhost:8080/api/v1/products \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "테스트 상품",
    "content": "상품 설명",
    "price": 10000,
    "categoryId": 1,
    "locationNm": "서울시 강남구",
    "latitude": 37.5665,
    "longitude": 126.9780,
    "isResell": false,
    "images": [
      { "path": "products/temp/sub_abc12345.jpg", "isMain": true }
    ]
  }'

# Response에서 확인:
{
  "id": 123,
  "images": [
    {
      "pImg": "/api/v1/static/products/123/main.jpg",  // ✅ 이동됨!
      "isMain": true
    }
  ]
}
```

### 3. 파일 시스템 확인

```bash
# 3. 파일이 이동되었는지 확인
ls BackEnd/src/main/resources/static/products/123/
# 출력: main.jpg

# temp 폴더에서는 삭제됨
ls BackEnd/src/main/resources/static/products/temp/
# 출력: (파일 없음)
```

### 4. 이미지 접근 테스트

브라우저에서 접근:
```
http://localhost:8080/api/v1/static/products/123/main.jpg
```

## 📊 로그 확인

서버 실행 시 다음 로그를 확인:

```log
# 1. 서버 시작 시
📁 Static resources configured: /api/v1/static/** → classpath:/static/

# 2. 이미지 업로드 시
📁 파일 저장 완료: products/temp/sub_abc12345.jpg

# 3. 상품 등록 시
INFO - 이미지 이동 완료: products/temp/sub_abc12345.jpg -> products/123/main.jpg
INFO - 상품 등록 완료: productId=123, 이미지 개수=1
```

## ⚠️ 주의사항

### 1. 기존 데이터 마이그레이션

기존에 `NewTag/static/uploads/`에 저장된 이미지가 있다면:
```bash
# 수동으로 이동 필요
mv NewTag/static/uploads/product_imgs/* BackEnd/src/main/resources/static/products/temp/
```

### 2. 프론트엔드 변경 불필요

프론트엔드 코드는 변경할 필요가 없습니다:
- API 경로가 `/api/v1/products`로 동일
- Request/Response 구조 동일
- 이미지 URL만 자동으로 변경됨

### 3. Git 설정

`.gitignore`에 이미 추가됨:
```gitignore
# 사용자 업로드 이미지 제외
BackEnd/src/main/resources/static/products/
!BackEnd/src/main/resources/static/products/.gitkeep
```

## 🎯 장점

### 1. **코드 일관성**
- Post와 Product가 같은 개념을 분리하지 않음
- RESTful API 설계 원칙 준수

### 2. **이미지 관리 개선**
- 상품별 폴더 분리로 관리 용이
- 파일명 규칙 통일 (main.jpg, sub_*.jpg)
- 삭제 시 폴더째 삭제 가능

### 3. **확장성**
- AWS S3 마이그레이션 시 구조 그대로 사용 가능
- 썸네일 생성 등 추가 기능 구현 용이

### 4. **안전성**
- 트랜잭션 관리로 데이터 일관성 보장
- 이미지 이동 실패 시에도 서비스 계속 동작
- 로깅으로 문제 추적 가능

## 🔗 관련 문서

- [IMAGE_STORAGE_DESIGN.md](./IMAGE_STORAGE_DESIGN.md) - 이미지 저장 구조 상세 설계
- [KAKAO_MAP_IMPLEMENTATION.md](./KAKAO_MAP_IMPLEMENTATION.md) - 카카오맵 구현

---

**작성일**: 2025-11-18
**작성자**: Claude (AI Assistant)
