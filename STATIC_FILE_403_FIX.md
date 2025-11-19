# 정적 파일 403 오류 해결 가이드

## 🚨 문제 상황

```
GET http://localhost:8081/api/v1/static/uploads/product_imgs/temp/sub_xxxxx.png
Status: 403 Forbidden
```

로그인을 했음에도 불구하고 이미지 파일 접근 시 403 오류 발생

---

## 🔍 원인 분석

### 1. Spring Security 설정 순서 문제
- `.requestMatchers()` 순서가 중요함
- 정적 리소스 허용이 다른 규칙보다 뒤에 있으면 먼저 매칭된 규칙이 적용됨

### 2. 상대 경로 문제
- `file:BackEnd/uploads/`는 실행 위치에 따라 달라짐
- IDE에서 실행: `C:\Users\USER\Desktop\NewTag\BackEnd\uploads\`
- JAR 실행: 다른 경로일 수 있음

### 3. 경로 매핑 불일치
- Frontend 요청: `/api/v1/static/uploads/product_imgs/temp/image.png`
- Backend 설정: `/api/v1/static/**` → `file:BackEnd/uploads/`
- 실제 파일: `BackEnd/uploads/product_imgs/temp/image.png`

**문제**: `/api/v1/static/`까지 제거하면 `uploads/product_imgs/temp/image.png`가 되어야 하는데, `BackEnd/uploads/` 아래에서 찾으므로 올바름.

---

## ✅ 해결 방법

### 1. SecurityConfig 수정

**위치**: `BackEnd/src/main/java/com/goldenRun/NewTag/security/SecurityConfig.java`

**변경 내용**:
```java
.authorizeHttpRequests(auth -> auth
    // CORS preflight 요청 (OPTIONS) 모두 허용
    .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

    // ===== 정적 리소스 (이미지 등) - 최우선 처리 =====
    .requestMatchers("/api/v1/static/**").permitAll()    // ← 추가
    .requestMatchers("/static/**").permitAll()
    .requestMatchers("/uploads/**").permitAll()

    // ===== 공개 엔드포인트 =====
    .requestMatchers("/api/v1/login", "/api/v1/signup", ...).permitAll()
    .requestMatchers("/api/v1/uploads/**").permitAll()   // ← 업로드 API 추가

    // ... 나머지 설정
    .anyRequest().authenticated()
)
```

**핵심**: 정적 리소스 패턴을 **가장 먼저** 배치

### 2. WebMvcConfig 절대 경로 사용

**위치**: `BackEnd/src/main/java/com/goldenRun/NewTag/config/WebMvcConfig.java`

**변경 전**:
```java
registry.addResourceHandler("/api/v1/static/**")
    .addResourceLocations("file:BackEnd/uploads/")  // ← 상대 경로
```

**변경 후**:
```java
@Value("${app.upload-dir:BackEnd/uploads}")
private String uploadDir;

@Override
public void addResourceHandlers(ResourceHandlerRegistry registry) {
    // 절대 경로로 변환
    Path absolutePath = Paths.get(uploadDir).toAbsolutePath().normalize();
    String resourceLocation = "file:" + absolutePath.toString() + "/";

    registry.addResourceHandler("/api/v1/static/**")
            .addResourceLocations(resourceLocation)  // ← 절대 경로
            .setCachePeriod(3600);

    System.out.println("[WebMvcConfig] Static resource location: " + resourceLocation);
}
```

**장점**:
- ✅ 실행 위치에 관계없이 절대 경로 사용
- ✅ 콘솔에 실제 경로 출력 (디버깅 용이)
- ✅ `application.properties`에서 경로 변경 가능

---

## 🧪 테스트 방법

### 1. Backend 서버 재시작

```bash
# 콘솔 출력 확인
[WebMvcConfig] Static resource location: file:C:/Users/USER/Desktop/NewTag/BackEnd/uploads/
```

### 2. 브라우저에서 직접 접근

```
http://localhost:8081/api/v1/static/uploads/product_imgs/temp/sub_50050b5f63ef4c0da8398f2c7426689a.png
```

**기대 결과**: 이미지가 표시됨 (403 아님!)

### 3. Frontend에서 테스트

```typescript
// productApi.ts
const imageUrl = `/api/v1/static/uploads/product_imgs/temp/sub_xxxxx.png`;

<img src={`http://localhost:8081${imageUrl}`} alt="Product" />
```

### 4. Network 탭 확인

**성공 시**:
```
GET http://localhost:8081/api/v1/static/uploads/product_imgs/temp/sub_xxx.png
Status: 200 OK
Content-Type: image/png
```

**실패 시**:
```
Status: 403 Forbidden  → SecurityConfig 문제
Status: 404 Not Found  → 파일 경로 문제
Status: 500 Server Error → WebMvcConfig 설정 문제
```

---

## 📋 체크리스트

### SecurityConfig
- [x] `/api/v1/static/**` 패턴이 `permitAll()`로 설정됨
- [x] 정적 리소스 규칙이 다른 규칙보다 **먼저** 배치됨
- [x] `/api/v1/uploads/**` (업로드 API)도 공개로 설정됨

### WebMvcConfig
- [x] 절대 경로 사용
- [x] `@Value`로 `app.upload-dir` 주입
- [x] 콘솔에 경로 출력

### application.properties
- [x] `app.upload-dir=BackEnd/uploads` 설정됨

### 파일 시스템
- [x] `BackEnd/uploads/product_imgs/temp/` 폴더 존재
- [x] 이미지 파일 존재 확인

---

## 🔧 추가 디버깅

### 경로 확인 Endpoint 추가 (임시)

```java
@RestController
@RequestMapping("/api/v1/test")
public class TestController {

    @Value("${app.upload-dir:BackEnd/uploads}")
    private String uploadDir;

    @GetMapping("/upload-path")
    public Map<String, Object> getUploadPath() {
        Path absolutePath = Paths.get(uploadDir).toAbsolutePath().normalize();

        return Map.of(
            "uploadDir", uploadDir,
            "absolutePath", absolutePath.toString(),
            "exists", Files.exists(absolutePath),
            "isDirectory", Files.isDirectory(absolutePath)
        );
    }

    @GetMapping("/list-images")
    public List<String> listImages() throws IOException {
        Path uploadPath = Paths.get(uploadDir, "product_imgs", "temp").toAbsolutePath();
        if (!Files.exists(uploadPath)) {
            return List.of("Directory not found: " + uploadPath);
        }

        return Files.list(uploadPath)
            .map(Path::getFileName)
            .map(Path::toString)
            .collect(Collectors.toList());
    }
}
```

**테스트**:
```bash
# 경로 확인
GET http://localhost:8081/api/v1/test/upload-path

# 이미지 목록
GET http://localhost:8081/api/v1/test/list-images
```

---

## ⚠️ 주의사항

### 1. CORS 문제일 수도 있음

브라우저 콘솔 확인:
```
Access to XMLHttpRequest at 'http://localhost:8081/api/v1/static/...'
from origin 'http://localhost:5173' has been blocked by CORS policy
```

**해결**: SecurityConfig의 CORS 설정 확인
```java
configuration.setAllowedOriginPatterns(Arrays.asList(
    "http://localhost:*",
    "http://127.0.0.1:*"
));
```

### 2. JWT 토큰 문제일 수도 있음

정적 리소스는 **인증이 필요 없어야** 합니다.

**확인**:
- SecurityConfig에서 `permitAll()` 설정 확인
- JWT Filter에서 정적 리소스 경로 제외 (필요 시)

### 3. 파일 권한 문제 (Linux/Mac)

```bash
# 읽기 권한 확인
ls -la BackEnd/uploads/product_imgs/temp/

# 권한 부여 (필요 시)
chmod -R 755 BackEnd/uploads/
```

---

## 📊 일반적인 403 오류 원인 우선순위

1. **Spring Security 설정** (가장 흔함)
   - `.requestMatchers()` 순서
   - `permitAll()` 누락

2. **경로 매핑 문제**
   - 상대 경로 vs 절대 경로
   - URL 패턴 불일치

3. **CORS 문제**
   - Origin 허용 설정
   - Preflight 요청 실패

4. **JWT Filter 간섭**
   - 정적 리소스에도 인증 요구

5. **파일 시스템 권한** (드물음)
   - Windows: 거의 없음
   - Linux/Mac: chmod 필요

---

## ✅ 최종 확인

**Backend 재시작 후**:

1. 콘솔에 경로 출력 확인:
   ```
   [WebMvcConfig] Static resource location: file:C:/Users/USER/Desktop/NewTag/BackEnd/uploads/
   ```

2. 브라우저에서 직접 접근:
   ```
   http://localhost:8081/api/v1/static/uploads/product_imgs/temp/sub_50050b5f63ef4c0da8398f2c7426689a.png
   ```

3. 200 OK 응답 확인

4. Frontend에서 이미지 로드 확인

---

**문서 작성**: 2025-11-18
**해결됨**: SecurityConfig 순서 + WebMvcConfig 절대 경로
