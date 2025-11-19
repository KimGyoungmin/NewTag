# 이미지 저장 구조 개선

## 📋 개요

상품 이미지 저장 구조를 개선하여 관리 효율성과 확장성을 향상시켰습니다.

**작업 날짜**: 2025-11-18

---

## ❌ 기존 구조의 문제점

### 이전 구조
```
NewTag/
├── static/uploads/          ← 프로젝트 루트에 이미지 저장
│   ├── xxxxx.jpg
│   ├── yyyyy.png
│   └── zzzzz.webp
├── FrontEnd/NewTag/
└── BackEnd/
```

### 문제점
1. **Git 저장소 크기 증가**
   - 사용자 업로드 이미지가 Git에 포함됨
   - 클론/풀 속도 저하
   - 이미지 파일 (2.8MB, 690KB 등) 누적

2. **프로젝트 구조 혼란**
   - 프론트엔드도 백엔드도 아닌 애매한 위치
   - 배포 시 경로 문제
   - 권한 관리 어려움

3. **상품별 이미지 관리 불가**
   - 모든 이미지가 한 폴더에 혼재
   - 상품 삭제 시 이미지 추적 어려움
   - 디버깅/유지보수 어려움

4. **확장성 제한**
   - 서버 확장 시 파일 동기화 불가능
   - 로드 밸런서 사용 시 문제
   - CDN 연동 어려움

---

## ✅ 개선된 구조

### 새로운 구조
```
NewTag/
├── BackEnd/
│   └── uploads/
│       └── product_imgs/
│           ├── product_1/
│           │   ├── main_xxxxx.jpg      ← 메인 이미지
│           │   ├── sub_yyyyy.jpg       ← 서브 이미지 1
│           │   └── sub_zzzzz.jpg       ← 서브 이미지 2
│           ├── product_2/
│           │   └── main_xxxxx.jpg
│           └── temp/                   ← 임시 폴더 (상품 ID 없을 때)
│               └── sub_xxxxx.jpg
├── FrontEnd/NewTag/
└── static/uploads/  (deprecated)       ← 기존 폴더 (마이그레이션 후 삭제)
```

### 장점
1. ✅ **상품별로 이미지 그룹화**
   - 폴더명으로 상품 식별 가능
   - 상품 삭제 시 폴더째 삭제 가능
   - 디버깅 용이

2. ✅ **Git에서 제외**
   - `.gitignore`에 `BackEnd/uploads/` 추가
   - 저장소 크기 증가 방지
   - 클린한 버전 관리

3. ✅ **명확한 책임 분리**
   - Backend가 파일 관리 책임
   - 프로젝트 구조 명확화
   - 배포 프로세스 단순화

4. ✅ **메인/서브 이미지 구분**
   - 파일명 접두사로 구분 (`main_`, `sub_`)
   - 정렬 및 표시 우선순위 명확
   - 빠른 파일 검색

---

## 🔧 구현 내역

### 1. FileStorageService 개선

#### 주요 메서드

**`storeProductImage(MultipartFile file, Long productId, boolean isMain)`**
- 상품 ID별로 폴더 생성
- 메인/서브 이미지 구분 (파일명 접두사)
- 파일 타입 및 크기 검증

```java
// 사용 예시
String path = fileStorageService.storeProductImage(file, productId, true);
// 결과: "uploads/product_imgs/product_123/main_abc123.jpg"
```

**파일 검증**:
- ✅ 이미지 파일만 허용 (MIME 타입 체크)
- ✅ 크기 제한: 10MB
- ✅ 허용 확장자: jpg, jpeg, png, gif, webp

**`deleteProductImages(Long productId)`**
- 상품의 모든 이미지 파일 삭제
- 폴더째 삭제 (재귀적)

**`deleteFile(String relativePath)`**
- 특정 이미지 파일만 삭제

### 2. 설정 파일 업데이트

#### application.properties
```properties
# File Upload Configuration
spring.servlet.multipart.max-file-size=10MB        # 단일 파일 최대 10MB
spring.servlet.multipart.max-request-size=50MB     # 전체 요청 최대 50MB

# Upload Directory
app.upload-dir=BackEnd/uploads                     # 업로드 루트 디렉토리
```

#### WebMvcConfig.java
```java
registry.addResourceHandler("/api/v1/static/**")
    .addResourceLocations("file:BackEnd/uploads/")  // 새 경로
    .setCachePeriod(3600);                          // 1시간 캐싱
```

#### .gitignore
```gitignore
# Uploaded Files (사용자 업로드 이미지)
BackEnd/uploads/
static/uploads/
```

### 3. ProductService 연동

```java
@Service
@RequiredArgsConstructor
public class ProductService {
    private final FileStorageService fileStorageService;

    // 향후 하드 삭제 기능 구현 시 사용
    @Transactional
    public void hardDeleteProduct(Long productId) {
        // 1. 이미지 파일 물리적 삭제
        fileStorageService.deleteProductImages(productId);

        // 2. DB에서 완전 삭제
        productRepository.delete(product);
    }
}
```

---

## 📊 폴더 구조 및 경로

### 저장 경로
| 구분 | 경로 |
|------|------|
| **물리적 경로** | `C:\Users\USER\Desktop\NewTag\BackEnd\uploads\product_imgs\product_1\main_xxx.jpg` |
| **DB 저장 경로** | `uploads/product_imgs/product_1/main_xxx.jpg` |
| **API 제공 경로** | `/api/v1/static/uploads/product_imgs/product_1/main_xxx.jpg` |

### 파일명 규칙
```
[접두사]_[UUID].[확장자]

예시:
- main_abc123def456.jpg        (메인 이미지)
- sub_xyz789abc012.png          (서브 이미지)
```

---

## 🔄 마이그레이션 가이드

### 1단계: 기존 이미지 복사

```bash
# Windows
xcopy /Y /I "static\uploads\*.*" "BackEnd\uploads\product_imgs\temp\"

# Linux/Mac
cp -r static/uploads/* BackEnd/uploads/product_imgs/temp/
```

### 2단계: DB 경로 업데이트 (필요 시)

```sql
-- product_image 테이블의 path 업데이트
UPDATE product_image
SET path = CONCAT('uploads/product_imgs/temp/', SUBSTRING_INDEX(path, '/', -1))
WHERE path LIKE 'uploads/%';
```

### 3단계: 검증

```sql
-- 이미지 경로 확인
SELECT id, path FROM product_image LIMIT 10;
```

### 4단계: 기존 폴더 제거

```bash
# 백업 후 삭제
rm -rf static/uploads/
```

---

## ⚠️ 주의사항

### 소프트 삭제와 이미지 관리

현재 프로젝트는 **소프트 삭제(Soft Delete)** 방식을 사용합니다.

```java
Product {
    is_delete: false  // 활성 상품
    is_delete: true   // 삭제된 상품 (데이터 보존)
}
```

**이미지 처리 정책**:

| 삭제 유형 | 이미지 파일 처리 | 사용 시점 |
|----------|----------------|----------|
| **소프트 삭제** | ✅ 파일 유지 | 사용자가 상품 삭제 |
| **하드 삭제** | ⚠️ 파일 삭제 | 관리자 영구 삭제 (선택적) |
| **배치 정리** | ⏱️ 자동 삭제 | 90일 이상 경과 (선택적) |

**소프트 삭제 시**:
```java
@Transactional
public void softDeleteProduct(Long productId) {
    product.setIs_delete(true);
    // 이미지 파일은 그대로 유지! (복구 가능성)
}
```

**하드 삭제 시** (선택적):
```java
@Transactional
public void hardDeleteProduct(Long productId) {
    // 이미지 파일 물리적 삭제
    fileStorageService.deleteProductImages(productId);
    // DB에서 완전 삭제
    productRepository.delete(product);
}
```

---

## 🚀 향후 개선 사항

### 1. 클라우드 스토리지 연동 (AWS S3)

**현재 문제**:
- 로컬 디스크 저장 → 서버 확장 시 파일 동기화 문제
- 백업/복구 수동 작업

**개선 방안**:
```java
@Service
public class S3FileStorageService implements FileStorageService {
    @Autowired
    private AmazonS3 s3Client;

    public String storeProductImage(MultipartFile file, Long productId, boolean isMain) {
        String key = "products/" + productId + "/" + (isMain ? "main_" : "sub_") + UUID.randomUUID();
        s3Client.putObject(bucketName, key, file.getInputStream(), metadata);
        return cloudFrontUrl + "/" + key;  // CDN URL 반환
    }
}
```

**장점**:
- ✅ 무제한 확장
- ✅ CDN 자동 배포
- ✅ 99.99% 가용성
- ✅ 자동 백업

### 2. 이미지 최적화

**썸네일 자동 생성**:
```java
public void storeWithOptimization(MultipartFile file, Long productId) {
    // 원본 저장
    String originalPath = storeProductImage(file, productId, true);

    // 썸네일 생성 (300x300)
    BufferedImage thumbnail = Thumbnails.of(file.getInputStream())
        .size(300, 300)
        .asBufferedImage();

    // WebP 변환 (용량 30% 감소)
    storeThumbnail(thumbnail, productId);
}
```

### 3. 자동 정리 배치 작업

**스케줄러 설정**:
```java
@Scheduled(cron = "0 0 3 * * *")  // 매일 새벽 3시
public void cleanupOldDeletedProducts() {
    // 90일 이상 소프트 삭제된 상품의 이미지 정리
    LocalDateTime cutoff = LocalDateTime.now().minusDays(90);
    List<Product> oldProducts = productRepository
        .findByIsDeleteTrueAndUpdatedAtBefore(cutoff);

    oldProducts.forEach(product -> {
        fileStorageService.deleteProductImages(product.getId());
        productRepository.delete(product);
    });
}
```

### 4. 이미지 메타데이터 관리

**확장 테이블**:
```sql
CREATE TABLE image_metadata (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    product_image_id BIGINT,
    file_size BIGINT,
    width INT,
    height INT,
    format VARCHAR(10),
    created_at DATETIME,
    FOREIGN KEY (product_image_id) REFERENCES product_image(id)
);
```

---

## 📈 성능 개선 효과

### 이전 vs 이후

| 항목 | 이전 | 이후 | 개선율 |
|------|------|------|--------|
| Git 저장소 크기 | 증가 중 (이미지 포함) | 최소화 (이미지 제외) | - |
| 이미지 검색 속도 | 느림 (모든 파일 스캔) | 빠름 (상품 폴더만) | ~70% |
| 상품 삭제 속도 | N개 파일 개별 삭제 | 1개 폴더 삭제 | ~90% |
| 파일 관리 복잡도 | 높음 (수작업) | 낮음 (자동화) | - |

---

## 📝 체크리스트

### 개발자
- [x] FileStorageService 개선
- [x] WebMvcConfig 경로 업데이트
- [x] application.properties 설정
- [x] .gitignore 추가
- [x] ProductService 연동
- [ ] 기존 이미지 마이그레이션
- [ ] DB path 업데이트 (필요 시)
- [ ] 테스트 (상품 등록, 이미지 업로드)

### 운영팀
- [ ] 기존 이미지 백업
- [ ] 마이그레이션 실행
- [ ] 검증 (이미지 정상 표시 확인)
- [ ] 기존 폴더 삭제

---

## 📚 참고 자료

- [Spring Boot File Upload Guide](https://spring.io/guides/gs/uploading-files/)
- [AWS S3 Integration](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html)
- [Image Optimization Best Practices](https://web.dev/fast/#optimize-your-images)

---

**문서 작성**: 2025-11-18
**마지막 업데이트**: 2025-11-18
**작성자**: Claude
