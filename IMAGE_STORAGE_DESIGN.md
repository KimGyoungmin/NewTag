# 이미지 저장 구조 설계 문서

## 📋 개요

상품 이미지를 상품별로 구조화하여 저장하고, Backend와 Frontend 간의 명확한 매핑을 제공합니다.

**작업 날짜**: 2025-11-18
**설계 목표**: 한 상품당 여러 이미지를 체계적으로 관리

---

## 📁 폴더 구조

### 최종 구조
```
BackEnd/
└── src/main/resources/
    └── static/
        ├── default_img.png              ← 기본 이미지 (Git 포함)
        ├── p_default_img.png            ← 기본 이미지 (Git 포함)
        └── products/                    ← 상품 이미지 루트 (Git 제외)
            ├── .gitkeep                 ← 폴더 추적용
            ├── 1/                       ← 상품 ID 1
            │   ├── main.jpg             ← 메인 이미지
            │   ├── sub_a1b2c3d4.jpg     ← 서브 이미지 1
            │   └── sub_e5f6g7h8.png     ← 서브 이미지 2
            ├── 2/                       ← 상품 ID 2
            │   ├── main.webp
            │   └── sub_12345678.jpg
            └── temp/                    ← 임시 폴더 (상품 등록 전)
                ├── sub_abcdefgh.jpg
                └── sub_ijklmnop.png
```

---

## 🔗 Backend & Frontend 매핑

### URL 매핑 테이블

| Frontend 요청 URL | Backend 경로 | 실제 파일 위치 |
|------------------|-------------|---------------|
| `/api/v1/static/default_img.png` | `classpath:/static/default_img.png` | `src/main/resources/static/default_img.png` |
| `/api/v1/static/products/1/main.jpg` | `classpath:/static/products/1/main.jpg` | `src/main/resources/static/products/1/main.jpg` |
| `/api/v1/static/products/1/sub_a1b2c3d4.jpg` | `classpath:/static/products/1/sub_a1b2c3d4.jpg` | `src/main/resources/static/products/1/sub_a1b2c3d4.jpg` |
| `/api/v1/static/products/temp/sub_abcd.jpg` | `classpath:/static/products/temp/sub_abcd.jpg` | `src/main/resources/static/products/temp/sub_abcd.jpg` |

### 예시

**Frontend 코드**:
```typescript
const imageUrl = product.mainImage; // DB에서 받은 값: "products/1/main.jpg"
const fullUrl = `http://localhost:8081/api/v1/static/${imageUrl}`;

<img src={fullUrl} alt="Product" />
// 실제 요청: http://localhost:8081/api/v1/static/products/1/main.jpg
```

**Backend 응답**:
```
GET /api/v1/static/products/1/main.jpg
→ WebMvcConfig: classpath:/static/products/1/main.jpg
→ File: src/main/resources/static/products/1/main.jpg
→ 200 OK (image/jpeg)
```

---

## 📊 데이터 흐름

### 1. 이미지 업로드 (상품 등록 전)

```
[Frontend - ProductRegisterPage.tsx]
1. 사용자가 이미지 선택
   ↓
2. postApi.uploadImage(file)
   → POST /api/v1/uploads/images (FormData)
   ↓
[Backend - UploadController]
3. FileStorageService.store(file)
   - 검증: 타입, 크기, 확장자
   - 저장: src/main/resources/static/products/temp/sub_abc12345.jpg
   - 반환: { path: "products/temp/sub_abc12345.jpg" }
   ↓
[Frontend]
4. 이미지 경로 저장
   images.push({ path: "products/temp/sub_abc12345.jpg", isMain: false })
```

### 2. 상품 등록

```
[Frontend]
5. 상품 등록 버튼 클릭
   ↓
6. postApi.create({
     title: "상품명",
     price: 50000,
     images: [
       { path: "products/temp/sub_abc12345.jpg", isMain: true },
       { path: "products/temp/sub_def67890.jpg", isMain: false }
     ]
   })
   ↓
[Backend - ProductService]
7. Product 저장 (DB에 ID 생성, 예: 123)
   ↓
8. ProductImage 저장
   - image1: { productId: 123, path: "products/temp/sub_abc12345.jpg", isMain: true }
   - image2: { productId: 123, path: "products/temp/sub_def67890.jpg", isMain: false }
   ↓
9. (선택적) 파일 이동
   FileStorageService.moveToProductFolder(tempPath, productId, isMain)
   - products/temp/sub_abc12345.jpg → products/123/main.jpg
   - products/temp/sub_def67890.jpg → products/123/sub_a1b2c3d4.jpg
   ↓
10. DB 경로 업데이트
   - image1.path = "products/123/main.jpg"
   - image2.path = "products/123/sub_a1b2c3d4.jpg"
```

### 3. 상품 조회

```
[Frontend]
GET /api/v1/products/123
   ↓
[Backend - ProductController]
ProductService.getProductDetail(123)
   ↓
Response:
{
  id: 123,
  title: "상품명",
  mainImage: "products/123/main.jpg",
  images: [
    { id: 1, pImg: "products/123/main.jpg", isMain: true },
    { id: 2, pImg: "products/123/sub_a1b2c3d4.jpg", isMain: false }
  ]
}
   ↓
[Frontend - ProductDetailPage]
<img src={`http://localhost:8081/api/v1/static/${product.mainImage}`} />
// 실제 요청: http://localhost:8081/api/v1/static/products/123/main.jpg
```

---

## 💻 Backend API

### FileStorageService 메서드

#### `store(MultipartFile file): String`
**용도**: 임시 폴더에 이미지 저장 (상품 등록 전)

```java
// 사용 예시
String path = fileStorageService.store(file);
// 반환: "products/temp/sub_abc12345.jpg"
```

#### `storeProductImage(MultipartFile file, Long productId, boolean isMain): String`
**용도**: 상품 폴더에 직접 저장 (productId가 있을 때)

```java
// 사용 예시
String path = fileStorageService.storeProductImage(file, 123L, true);
// 반환: "products/123/main.jpg"
```

#### `moveToProductFolder(String tempPath, Long productId, boolean isMain): String`
**용도**: 임시 폴더에서 상품 폴더로 이동

```java
// 사용 예시
String oldPath = "products/temp/sub_abc12345.jpg";
String newPath = fileStorageService.moveToProductFolder(oldPath, 123L, true);
// 반환: "products/123/main.jpg"
// 파일 이동: temp/sub_abc12345.jpg → 123/main.jpg
```

#### `deleteProductFolder(Long productId): void`
**용도**: 상품 폴더 전체 삭제

```java
// 사용 예시
fileStorageService.deleteProductFolder(123L);
// 삭제: src/main/resources/static/products/123/ 전체
```

#### `deleteFile(String relativePath): void`
**용도**: 특정 이미지 파일 삭제

```java
// 사용 예시
fileStorageService.deleteFile("products/123/sub_a1b2c3d4.jpg");
// 삭제: src/main/resources/static/products/123/sub_a1b2c3d4.jpg
```

---

## 🎨 Frontend API

### postApi (Frontend/NewTag/src/api/postApi.ts)

#### `uploadImage(file: File): Promise<UploadImageResponse>`
**용도**: 이미지 파일 업로드

```typescript
const file = event.target.files[0];
const response = await postApi.uploadImage(file);
// response: { success: true, path: "products/temp/sub_abc12345.jpg", url: "/api/v1/static/products/temp/sub_abc12345.jpg" }
```

#### `create(payload: CreatePostRequest): Promise<PostSimpleResponse>`
**용도**: 상품 등록

```typescript
await postApi.create({
  title: "상품명",
  price: 50000,
  categoryId: 1,
  locationNm: "서울시 강남구",
  latitude: 37.5665,
  longitude: 126.9780,
  images: [
    { path: "products/temp/sub_abc.jpg", isMain: true },
    { path: "products/temp/sub_def.jpg", isMain: false }
  ],
  isResell: false
});
```

---

## 🔧 설정 파일

### application.properties
```properties
# File Upload Configuration
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=50MB

# Upload Directory (resources/static 하위)
app.upload.base-dir=src/main/resources/static
app.upload.product-dir=products
```

### .gitignore
```gitignore
# Uploaded Files (사용자 업로드 이미지)
BackEnd/src/main/resources/static/products/
!BackEnd/src/main/resources/static/products/.gitkeep
```

**설명**:
- `products/` 폴더의 모든 파일은 Git에서 제외
- `.gitkeep` 파일만 포함하여 폴더 구조 유지

---

## 📝 파일명 규칙

### 메인 이미지
```
main.jpg
main.png
main.webp
```
- 확장자는 원본 파일 확장자 사용
- 상품당 1개만 존재

### 서브 이미지
```
sub_a1b2c3d4.jpg
sub_e5f6g7h8.png
sub_12345678.webp
```
- `sub_` 접두사 + 8자리 랜덤 문자열 + 확장자
- 상품당 여러 개 가능

---

## ✅ 검증 규칙

### 파일 타입
- ✅ 허용: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- ❌ 거부: 그 외 모든 타입

### 파일 크기
- ✅ 허용: 10MB 이하
- ❌ 거부: 10MB 초과

### 확장자
- ✅ 허용: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
- ❌ 거부: 그 외 모든 확장자

---

## 🧪 테스트 가이드

### 1. Backend 서버 시작
```bash
# 콘솔 로그 확인
📁 Static resources configured: /api/v1/static/** → classpath:/static/
```

### 2. 이미지 업로드 테스트
```bash
curl -X POST http://localhost:8081/api/v1/uploads/images \
  -F "file=@test-image.jpg"

# 응답
{
  "success": true,
  "path": "products/temp/sub_a1b2c3d4.jpg",
  "url": "/api/v1/static/products/temp/sub_a1b2c3d4.jpg"
}
```

### 3. 이미지 접근 테스트
```bash
# 브라우저에서
http://localhost:8081/api/v1/static/products/temp/sub_a1b2c3d4.jpg

# 기대 결과: 200 OK, 이미지 표시
```

### 4. 폴더 구조 확인
```bash
ls -la BackEnd/src/main/resources/static/products/

# 기대 출력
drwxr-xr-x  temp/
drwxr-xr-x  1/
drwxr-xr-x  2/
```

---

## 🚀 마이그레이션 가이드

### 기존 이미지 이동

```bash
# 1. 기존 이미지 확인
ls static/uploads/

# 2. temp 폴더로 복사
mkdir -p BackEnd/src/main/resources/static/products/temp
cp static/uploads/* BackEnd/src/main/resources/static/products/temp/

# 3. DB 업데이트 (필요 시)
UPDATE product_image
SET path = CONCAT('products/temp/', SUBSTRING_INDEX(path, '/', -1))
WHERE path LIKE 'uploads/%';

# 4. 검증
SELECT path FROM product_image LIMIT 10;
```

---

## 📊 성능 최적화

### 캐싱 전략
- **브라우저 캐싱**: 1시간 (3600초)
- **CDN 연동**: 추후 CloudFront 등 추가 가능

### 이미지 최적화 (향후 개선)
```java
// 썸네일 자동 생성
public void createThumbnail(String originalPath, int width, int height) {
    BufferedImage thumbnail = Thumbnails.of(originalPath)
        .size(width, height)
        .asBufferedImage();

    // 저장: products/1/main_thumb.jpg
}

// WebP 변환 (30% 용량 감소)
public String convertToWebP(String originalPath) {
    // ImageIO를 사용한 WebP 변환
}
```

---

## ⚠️ 주의사항

### 1. 소프트 삭제 고려
- 현재 프로젝트는 `is_delete = true`로 소프트 삭제 사용
- **이미지 파일은 삭제하지 않음** (데이터 복구 가능성)
- 하드 삭제 시에만 `deleteProductFolder()` 사용

### 2. 동시성 문제
- 같은 상품에 여러 이미지를 동시 업로드 시 파일명 충돌 없음
- `sub_` 뒤에 랜덤 문자열 사용

### 3. 디스크 용량 관리
- 정기적으로 `temp/` 폴더 정리 필요
- 배치 작업으로 7일 이상 된 temp 파일 삭제 권장

---

## 📚 참고 자료

- [Spring Boot Static Resources](https://docs.spring.io/spring-boot/docs/current/reference/html/web.html#web.servlet.spring-mvc.static-content)
- [Multipart File Upload](https://spring.io/guides/gs/uploading-files/)
- [RESTful API Design](https://restfulapi.net/)

---

**문서 작성**: 2025-11-18
**마지막 업데이트**: 2025-11-18
**작성자**: Claude
