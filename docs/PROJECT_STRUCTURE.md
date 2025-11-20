# NewTag 프로젝트 구조 문서

**생성일**: 2025-11-17
**분석 도구**: Gemini AI Daily Analysis
**프로젝트 타입**: Spring Boot (Backend) + React (Frontend)

---

## 📋 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [기술 스택](#기술-스택)
3. [디렉토리 구조](#디렉토리-구조)
4. [주요 컴포넌트](#주요-컴포넌트)
5. [데이터베이스 구조](#데이터베이스-구조)
6. [API 엔드포인트](#api-엔드포인트)
7. [개선 권장사항](#개선-권장사항)

---

## 🎯 프로젝트 개요

**프로젝트명**: NewTag
**설명**: 중고 거래 플랫폼 (당근마켓 유사)
**아키텍처**: Monorepo (Backend + Frontend)

### 주요 기능
- 상품 등록/조회/수정/삭제
- 검색 및 카테고리 필터링
- 찜하기 (Favorites)
- 사용자 인증 (JWT)
- 상품 리뷰 및 평점
- 채팅 (진행 중)
- 리셀 마켓

---

## 🛠️ 기술 스택

### Backend
```yaml
Framework: Spring Boot
Build Tool: Maven
Language: Java
ORM: JPA/Hibernate
Security: Spring Security + JWT
Database: MySQL/MariaDB (추정)
API Style: RESTful
```

**주요 의존성**:
- Spring Boot Starter Web
- Spring Boot Starter Data JPA
- Spring Boot Starter Security
- Spring Boot Starter Validation
- Lombok
- JWT Library

### Frontend
```yaml
Framework: React 18+
Build Tool: Vite
Language: TypeScript
Styling: Tailwind CSS
State Management: Zustand
UI Components: Radix UI + shadcn/ui
HTTP Client: Axios
Routing: Custom (Page-based)
```

**주요 패키지**:
```json
{
  "react": "^18.x",
  "typescript": "^5.x",
  "vite": "^5.x",
  "tailwindcss": "^3.x",
  "zustand": "^4.x",
  "axios": "^1.x",
  "@radix-ui/react-*": "latest",
  "lucide-react": "^0.x"
}
```

### Additional Tools
```yaml
Web Scraping: Python + Selenium
ERD Tool: VueRD (product.vuerd.json)
Version Control: Git
```

---

## 📁 디렉토리 구조

```
NewTag/
├── BackEnd/                          # Spring Boot 백엔드
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/goldenRun/NewTag/
│   │   │   │   ├── controller/       # REST API 컨트롤러
│   │   │   │   │   ├── ProductController.java
│   │   │   │   │   ├── FavoriteController.java
│   │   │   │   │   ├── ReviewController.java
│   │   │   │   │   └── UserController.java
│   │   │   │   ├── service/          # 비즈니스 로직
│   │   │   │   │   ├── ProductService.java
│   │   │   │   │   ├── FavoriteService.java
│   │   │   │   │   ├── ReviewService.java
│   │   │   │   │   ├── SearchLogService.java
│   │   │   │   │   └── UserService.java
│   │   │   │   ├── Repository/       # JPA 레포지토리
│   │   │   │   │   ├── ProductRepository.java
│   │   │   │   │   ├── FavoriteRepository.java
│   │   │   │   │   ├── ReviewRepository.java
│   │   │   │   │   ├── SearchLogRepository.java
│   │   │   │   │   └── UserRepository.java
│   │   │   │   ├── entity/           # JPA 엔티티
│   │   │   │   │   ├── Product.java
│   │   │   │   │   ├── ProductImage.java
│   │   │   │   │   ├── Favorite.java
│   │   │   │   │   ├── Review.java
│   │   │   │   │   ├── SearchLog.java
│   │   │   │   │   └── User.java
│   │   │   │   ├── dto/              # Data Transfer Objects
│   │   │   │   │   ├── ProductDtos.java
│   │   │   │   │   └── ReviewDtos.java
│   │   │   │   ├── security/         # Spring Security 설정
│   │   │   │   │   ├── SecurityConfig.java
│   │   │   │   │   ├── JwtAuthenticationFilter.java
│   │   │   │   │   └── JwtTokenProvider.java
│   │   │   │   └── BackEndApplication.java
│   │   │   └── resources/
│   │   │       ├── application.properties
│   │   │       └── static/
│   │   └── test/                     # 테스트 코드
│   ├── pom.xml                       # Maven 설정
│   └── .gitignore
│
├── FrontEnd/NewTag/                  # React 프론트엔드
│   ├── src/
│   │   ├── api/                      # API 클라이언트
│   │   │   ├── client.ts             # Axios 설정 + 인터셉터
│   │   │   ├── auth.ts               # 인증 API
│   │   │   ├── products.ts           # 상품 API
│   │   │   └── favoriteApi.ts        # 찜하기 API
│   │   ├── components/               # 재사용 가능한 컴포넌트
│   │   │   ├── ui/                   # shadcn/ui 컴포넌트
│   │   │   ├── Header.tsx
│   │   │   ├── BottomNav.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   ├── CategoryFilter.tsx
│   │   │   └── ...
│   │   ├── pages/                    # 페이지 컴포넌트
│   │   │   ├── HomePage.tsx
│   │   │   ├── ProductDetailPage.tsx
│   │   │   ├── ProductRegisterPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── MyPage.tsx
│   │   │   └── ...
│   │   ├── types/                    # TypeScript 타입 정의
│   │   │   └── index.ts
│   │   ├── utils/                    # 유틸리티 함수
│   │   │   └── localStorage.ts
│   │   ├── App.tsx                   # 메인 App 컴포넌트
│   │   ├── main.tsx                  # 엔트리 포인트
│   │   └── index.css                 # 글로벌 스타일
│   ├── public/                       # 정적 파일
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── .gitignore
│
├── .ai-workflow/                     # AI 워크플로우 (Gemini)
│   ├── scripts/
│   └── gemini-output/
│
├── selenium_profile/                 # Selenium 크롤러 설정
├── crawl_kream_cdp.py               # 크롤링 스크립트
│
├── DDL.sql                          # 데이터베이스 스키마 정의
├── DML.sql                          # 초기 데이터
├── PRODUCT_DUMMY_DATA.sql           # 더미 상품 데이터
├── product.vuerd.json               # ERD 다이어그램
│
├── TROUBLESHOOTING.md               # 트러블슈팅 가이드
├── PROJECT_STRUCTURE.md             # 이 문서
│
└── .gitignore                       # Git 제외 파일
```

---

## 🧩 주요 컴포넌트

### Backend 아키텍처

```
┌─────────────────┐
│   Controller    │  ← REST API 엔드포인트
└────────┬────────┘
         │
┌────────▼────────┐
│    Service      │  ← 비즈니스 로직
└────────┬────────┘
         │
┌────────▼────────┐
│   Repository    │  ← 데이터 액세스
└────────┬────────┘
         │
┌────────▼────────┐
│    Entity       │  ← JPA 엔티티
└────────┬────────┘
         │
┌────────▼────────┐
│    Database     │  ← MySQL/MariaDB
└─────────────────┘
```

### Frontend 아키텍처

```
┌─────────────────┐
│    App.tsx      │  ← 라우팅 및 페이지 관리
└────────┬────────┘
         │
    ┌────▼─────┬──────────┬──────────┐
    │          │          │          │
┌───▼────┐ ┌──▼────┐ ┌───▼────┐ ┌───▼────┐
│ Pages  │ │ Comps │ │  API   │ │ Utils  │
└───┬────┘ └───────┘ └───┬────┘ └────────┘
    │                     │
    │                ┌────▼──────┐
    └───────────────►│   Axios   │
                     └───┬───────┘
                         │
                    ┌────▼──────┐
                    │  Backend  │
                    └───────────┘
```

---

## 🗄️ 데이터베이스 구조

### 주요 테이블

#### 1. Product (상품)
```sql
CREATE TABLE product (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    price DECIMAL(10, 2),
    category_id BIGINT,
    location_nm VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    view_count INT DEFAULT 0,
    is_delete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    user_id BIGINT,
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (category_id) REFERENCES category(id)
);
```

#### 2. ProductImage (상품 이미지)
```sql
CREATE TABLE product_image (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    product_id BIGINT,
    path VARCHAR(500),
    is_main BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (product_id) REFERENCES product(id)
);
```

#### 3. Favorite (찜하기)
```sql
CREATE TABLE favorite (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    product_id BIGINT,
    user_id BIGINT,
    created_at TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES product(id),
    FOREIGN KEY (user_id) REFERENCES user(id),
    UNIQUE KEY unique_favorite (product_id, user_id)
);
```

#### 4. Review (리뷰)
```sql
CREATE TABLE review (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    product_id BIGINT,
    seller_id BIGINT,
    buyer_id BIGINT,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES product(id),
    FOREIGN KEY (seller_id) REFERENCES user(id),
    FOREIGN KEY (buyer_id) REFERENCES user(id)
);
```

#### 5. SearchLog (검색 로그)
```sql
CREATE TABLE search_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    keyword VARCHAR(255),
    result_count INT,
    device_type VARCHAR(50),
    created_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id)
);
```

#### 6. User (사용자)
```sql
CREATE TABLE user (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### ERD 다이어그램

ERD는 `product.vuerd.json` 파일에서 확인 가능합니다.
VueRD 도구로 열람: https://vuerd.github.io/

---

## 🌐 API 엔드포인트

### 인증 API
```
POST   /api/v1/auth/login          # 로그인
POST   /api/v1/auth/register       # 회원가입
POST   /api/v1/auth/logout         # 로그아웃
GET    /api/v1/auth/me             # 현재 사용자 정보
```

### 상품 API
```
GET    /api/v1/products                    # 상품 목록 조회 (페이징)
GET    /api/v1/products/{id}               # 상품 상세 조회
POST   /api/v1/products                    # 상품 등록
PUT    /api/v1/products/{id}               # 상품 수정
DELETE /api/v1/products/{id}               # 상품 삭제
POST   /api/v1/products/{id}/view          # 조회수 증가
GET    /api/v1/products/seller/{sellerId}  # 판매자별 상품 조회
```

### 검색 API
```
GET    /api/v1/products/search              # 상품 검색
GET    /api/v1/products/search/popular      # 인기 검색어 조회
GET    /api/v1/products/search/recent       # 최근 검색어 조회 (사용자별)
```

**쿼리 파라미터**:
- `keyword`: 검색 키워드
- `userId`: 사용자 ID
- `deviceType`: 디바이스 타입 (MOBILE, WEB)
- `page`: 페이지 번호 (0부터 시작)
- `size`: 페이지 크기
- `categoryId`: 카테고리 ID (옵션)
- `sortBy`: 정렬 기준 (latest, price-low, price-high, popular)

### 찜하기 API
```
POST   /api/v1/favorites/{productId}       # 찜하기 토글
GET    /api/v1/favorites/my-products       # 내가 찜한 상품 ID 목록
```

**요청/응답 예시**:
```json
// POST /api/v1/favorites/1?userId=1
{
  "isFavorited": true,
  "favoriteCount": 5
}
```

### 리뷰 API
```
POST   /api/v1/reviews                     # 리뷰 작성
GET    /api/v1/reviews/seller/{sellerId}   # 판매자 리뷰 조회
GET    /api/v1/reviews/seller/{sellerId}/summary  # 판매자 평점 요약
```

---

## 📊 주요 기능 플로우

### 1. 상품 목록 조회 플로우

```
User
 │
 ├─ GET /api/v1/products?page=0&size=30
 │
 ├─ ProductController.getProducts()
 │   │
 │   ├─ ProductService.getProductList()
 │   │   │
 │   │   ├─ ProductRepository.findAllNotDeleted()  [Query 1]
 │   │   │
 │   │   ├─ FavoriteService.getFavoriteCounts()    [Query 2]
 │   │   │   └─ FavoriteRepository.countByProductIds()
 │   │   │
 │   │   └─ Convert to DTO with favoriteCount
 │   │
 │   └─ Return Page<ProductDtos.ListItem>
 │
 └─ Response: { products: [...], totalElements: 100 }
```

**성능 최적화**:
- N+1 문제 해결: 2번의 쿼리로 모든 데이터 조회
- 31번 → 2번 쿼리 감소 (93% 개선)

### 2. 검색 플로우

```
User
 │
 ├─ GET /api/v1/products/search?keyword=아이폰&userId=1
 │
 ├─ ProductController.searchProducts()
 │   │
 │   ├─ ProductService.searchProducts()
 │   │   │
 │   │   ├─ ProductRepository.searchByTitle()     [Query 1]
 │   │   │
 │   │   ├─ SearchLogService.logSearch()          [Query 2]
 │   │   │   └─ Insert search log
 │   │   │
 │   │   ├─ FavoriteService.getFavoriteCounts()   [Query 3]
 │   │   │
 │   │   └─ Convert to DTO
 │   │
 │   └─ Return search results
 │
 └─ Response: { products: [...], totalElements: 25 }
```

### 3. 무한 스크롤 플로우

```
User scrolls to bottom
 │
 ├─ Intersection Observer detects last item
 │
 ├─ HomePage.loadMoreProducts()
 │   │
 │   ├─ GET /api/v1/products?page=1&size=10
 │   │
 │   └─ Append to existing products
 │
 └─ Render additional 10 products
```

---

## 🔒 보안 구조

### JWT 인증 플로우

```
1. Login Request
   ↓
2. UserController.login()
   ↓
3. Validate credentials
   ↓
4. JwtTokenProvider.generateToken()
   ↓
5. Return JWT token to client
   ↓
6. Client stores token in localStorage
   ↓
7. Subsequent requests include token in Authorization header
   ↓
8. JwtAuthenticationFilter intercepts request
   ↓
9. JwtTokenProvider.validateToken()
   ↓
10. Set Authentication in SecurityContext
   ↓
11. Process request
```

### Security Configuration

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // Public endpoints (no authentication required)
    .requestMatchers("/api/v1/auth/**").permitAll()
    .requestMatchers("/api/v1/products").permitAll()
    .requestMatchers("/api/v1/products/{id}").permitAll()
    .requestMatchers("/api/v1/products/search/**").permitAll()

    // Temporary permitAll (TODO: Fix JWT)
    .requestMatchers("/api/v1/favorites/**").permitAll()

    // All other endpoints require authentication
    .anyRequest().authenticated()
}
```

**현재 이슈**:
- 찜하기 API에 임시로 `permitAll()` 적용됨
- JWT 토큰 전달 문제 디버깅 중
- 자세한 내용은 `TROUBLESHOOTING.md` 참조

---

## 🎨 프론트엔드 구조

### 페이지 라우팅

App.tsx에서 중앙 집중식 라우팅:

```typescript
const renderPage = () => {
  switch (currentPage) {
    case "login":         return <LoginPage />
    case "signup":        return <SignupPage />
    case "home":          return <HomePage />
    case "detail":        return <ProductDetailPage />
    case "register":      return <ProductRegisterPage />
    case "mypage":        return <MyPage />
    case "chat":          return <ChatListPage />
    case "chatroom":      return <ChatPage />
    case "resell":        return <ResellPage />
    default:              return <HomePage />
  }
}
```

### 상태 관리

**로컬 상태**: React useState/useEffect
```typescript
const [products, setProducts] = useState<Product[]>([]);
const [loading, setLoading] = useState(false);
```

**전역 상태**: Zustand (사용 가능하나 현재 미사용)
```typescript
// 향후 사용 가능
import create from 'zustand'

const useStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}))
```

**로컬 스토리지**: 인증 토큰, 검색 기록
```typescript
localStorage.setItem('token', token)
localStorage.getItem('token')
localStorage.removeItem('token')
```

### API 클라이언트

Axios 기반 HTTP 클라이언트:

```typescript
// client.ts
const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
  timeout: 10000,
});

// Request interceptor - JWT 토큰 자동 추가
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - 에러 처리
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 토큰 만료 처리
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## 📦 빌드 및 배포

### Backend 빌드

```bash
cd BackEnd
mvn clean package

# JAR 파일 생성
# target/NewTag-0.0.1-SNAPSHOT.jar

# 실행
java -jar target/NewTag-0.0.1-SNAPSHOT.jar
```

### Frontend 빌드

```bash
cd FrontEnd/NewTag
npm install
npm run build

# 빌드 결과
# dist/ 디렉토리 생성

# 개발 서버 실행
npm run dev
```

### 환경 변수

**Backend (application.properties)**:
```properties
# Database
spring.datasource.url=jdbc:mysql://localhost:3306/newtag
spring.datasource.username=root
spring.datasource.password=password

# JPA
spring.jpa.hibernate.ddl-auto=none
spring.jpa.show-sql=true

# JWT
jwt.secret=your-secret-key
jwt.expiration=86400000

# File Upload
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB
```

**Frontend (.env)**:
```bash
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

---

## 🔧 개발 환경 설정

### Prerequisites

- **Java**: JDK 17+
- **Node.js**: v18+
- **Maven**: 3.8+
- **MySQL**: 8.0+
- **Python**: 3.8+ (크롤러용)

### Backend 설정

1. 데이터베이스 생성
```sql
CREATE DATABASE newtag CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. 스키마 및 초기 데이터 로드
```bash
mysql -u root -p newtag < DDL.sql
mysql -u root -p newtag < DML.sql
mysql -u root -p newtag < PRODUCT_DUMMY_DATA.sql
```

3. application.properties 설정
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/newtag
spring.datasource.username=your_username
spring.datasource.password=your_password
```

4. 서버 실행
```bash
cd BackEnd
mvn spring-boot:run
```

### Frontend 설정

1. 의존성 설치
```bash
cd FrontEnd/NewTag
npm install
```

2. 개발 서버 실행
```bash
npm run dev
```

3. 브라우저에서 확인
```
http://localhost:5173
```

---

## 🚀 개선 권장사항

### 1. 데이터베이스 마이그레이션 도구 도입 ⭐⭐⭐

**현재 상황**:
- 수동으로 DDL.sql, DML.sql 관리
- 스키마 변경 이력 추적 어려움
- 팀원 간 데이터베이스 동기화 문제 가능

**권장 사항**:
```xml
<!-- pom.xml에 Flyway 추가 -->
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency>
```

**마이그레이션 파일 예시**:
```sql
-- src/main/resources/db/migration/V1__Create_product_table.sql
CREATE TABLE product (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    ...
);

-- V2__Add_favorite_table.sql
-- V3__Add_search_log_table.sql
```

**효과**:
- ✅ 스키마 변경 이력 자동 관리
- ✅ 애플리케이션 버전과 DB 스키마 일관성 유지
- ✅ 롤백 기능
- ✅ 팀 협업 개선

### 2. API 문서 자동화 ⭐⭐⭐

**현재 상황**:
- API 명세가 코드에만 존재
- 프론트엔드 개발자가 코드를 직접 확인해야 함
- API 변경 사항 추적 어려움

**권장 사항 - Swagger/OpenAPI 적용**:

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.2.0</version>
</dependency>
```

```java
@RestController
@RequestMapping("/api/v1/products")
@Tag(name = "Product", description = "상품 관리 API")
public class ProductController {

    @Operation(summary = "상품 목록 조회", description = "페이징된 상품 목록을 조회합니다")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "조회 성공"),
        @ApiResponse(responseCode = "400", description = "잘못된 요청")
    })
    @GetMapping
    public ResponseEntity<Page<ProductDto>> getProducts(
        @Parameter(description = "페이지 번호", example = "0")
        @RequestParam(defaultValue = "0") int page
    ) {
        // ...
    }
}
```

**접근 URL**: `http://localhost:8080/swagger-ui.html`

**효과**:
- ✅ 자동으로 API 문서 생성
- ✅ 인터랙티브한 API 테스트 가능
- ✅ 프론트엔드 개발자와의 협업 효율 증가
- ✅ API 변경 사항 자동 반영

### 3. CI/CD 파이프라인 구축 ⭐⭐

**권장 사항 - GitHub Actions**:

`.github/workflows/ci.yml`:
```yaml
name: CI

on:
  push:
    branches: [ main, dev ]
  pull_request:
    branches: [ main, dev ]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up JDK 17
        uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'
      - name: Build with Maven
        run: |
          cd BackEnd
          mvn clean package
      - name: Run tests
        run: |
          cd BackEnd
          mvn test

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd FrontEnd/NewTag
          npm ci
      - name: Build
        run: |
          cd FrontEnd/NewTag
          npm run build
      - name: Run tests
        run: |
          cd FrontEnd/NewTag
          npm test
```

**효과**:
- ✅ 코드 변경 시 자동 빌드 및 테스트
- ✅ 코드 품질 유지
- ✅ 배포 자동화 가능

### 4. .gitignore 통합 ⭐

**현재 상황**:
- 루트, BackEnd, FrontEnd에 각각 .gitignore 존재
- 중복된 설정 가능성

**권장 사항**:

루트 `.gitignore`로 통합:
```gitignore
# Java
BackEnd/target/
BackEnd/*.jar
BackEnd/*.war
BackEnd/*.class

# Node
FrontEnd/NewTag/node_modules/
FrontEnd/NewTag/dist/
FrontEnd/NewTag/.env.local

# IDE
.idea/
*.iml
.vscode/

# OS
.DS_Store
Thumbs.db

# Database
*.sql~

# Logs
*.log

# Python
__pycache__/
*.pyc
venv/
selenium_profile/
```

### 5. 환경별 설정 분리 ⭐⭐

**Backend**:
```properties
# application-dev.properties
spring.datasource.url=jdbc:mysql://localhost:3306/newtag_dev

# application-prod.properties
spring.datasource.url=jdbc:mysql://prod-server:3306/newtag
```

실행:
```bash
java -jar app.jar --spring.profiles.active=prod
```

**Frontend**:
```bash
# .env.development
VITE_API_BASE_URL=http://localhost:8080/api/v1

# .env.production
VITE_API_BASE_URL=https://api.newtag.com/v1
```

### 6. 테스트 코드 작성 ⭐⭐⭐

**Backend 단위 테스트**:
```java
@SpringBootTest
class ProductServiceTest {

    @Autowired
    private ProductService productService;

    @Test
    void testGetProductList() {
        Page<ProductDtos.ListItem> products =
            productService.getProductList(null, "latest", 0, 30);

        assertNotNull(products);
        assertTrue(products.getContent().size() <= 30);
    }
}
```

**Frontend 컴포넌트 테스트**:
```typescript
import { render, screen } from '@testing-library/react'
import { ProductCard } from './ProductCard'

test('renders product card', () => {
  render(<ProductCard title="Test Product" price={1000} />)
  expect(screen.getByText('Test Product')).toBeInTheDocument()
})
```

### 7. 에러 처리 개선 ⭐⭐

**Backend 전역 예외 처리**:
```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(
        ResourceNotFoundException ex
    ) {
        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse(ex.getMessage()));
    }
}
```

**Frontend 에러 바운더리**:
```typescript
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error('Error:', error, errorInfo)
    // 에러 로깅 서비스에 전송
  }

  render() {
    if (this.state.hasError) {
      return <ErrorPage />
    }
    return this.props.children
  }
}
```

### 8. 성능 모니터링 ⭐

**추천 도구**:
- Backend: Spring Boot Actuator + Prometheus + Grafana
- Frontend: Google Analytics, Sentry
- Database: MySQL Slow Query Log

### 9. 코드 품질 도구 ⭐

**Backend**:
- SonarQube: 코드 품질 분석
- Checkstyle: 코딩 스타일 검사
- SpotBugs: 버그 탐지

**Frontend**:
- ESLint: 코드 품질 검사
- Prettier: 코드 포맷팅
- Husky: Git hooks로 자동 검사

### 10. 보안 강화 ⭐⭐⭐

**현재 이슈**:
- JWT 토큰 인증 문제 (진행 중)
- 찜하기 API에 임시 permitAll 적용

**개선 사항**:
- [ ] JWT 토큰 전달 문제 해결
- [ ] HTTPS 적용
- [ ] CORS 정책 검토
- [ ] SQL Injection 방지 (Prepared Statement 사용 확인)
- [ ] XSS 방지 (입력 검증 및 이스케이프)
- [ ] Rate Limiting (API 호출 제한)

---

## 📚 추가 문서

- **트러블슈팅**: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **API 문서**: (Swagger 도입 후 자동 생성 예정)
- **ERD**: [product.vuerd.json](./product.vuerd.json)
- **개발 가이드**: (작성 예정)

---

## 🤝 기여 가이드

### Git 브랜치 전략

```
main          ← 프로덕션 배포용
  └─ dev      ← 개발 통합 브랜치
      ├─ feature/user-auth
      ├─ feature/product-search
      └─ fix/jwt-token-issue
```

### 커밋 메시지 규칙

```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅, 세미콜론 누락 등
refactor: 코드 리팩토링
test: 테스트 코드 추가
chore: 빌드 업무, 패키지 매니저 설정 등

예시:
feat: 무한 스크롤 기능 구현
fix: JWT 토큰 인증 문제 해결
docs: API 문서 업데이트
```

### Pull Request 템플릿

```markdown
## 변경 사항
- 무엇을 변경했는지 설명

## 관련 이슈
- Closes #123

## 테스트 방법
- 어떻게 테스트했는지 설명

## 스크린샷
(UI 변경 시)
```

---

## 📞 문의 및 지원

- **프로젝트 저장소**: [GitHub Repository URL]
- **이슈 트래커**: [GitHub Issues URL]
- **개발팀 이메일**: dev@newtag.com

---

**문서 버전**: 1.0
**최종 업데이트**: 2025-11-17
**작성자**: Gemini AI + Claude Code
**검토자**: Development Team

---

## 부록

### A. 프로젝트 통계

```
총 파일 수: ~100개 (node_modules, target 제외)
총 코드 라인 수: ~10,000 라인 (추정)
Backend 파일: ~40개
Frontend 파일: ~50개
SQL 파일: 3개
설정 파일: ~10개
```

### B. 주요 라이브러리 버전

**Backend**:
- Spring Boot: 3.x
- Java: 17
- JPA/Hibernate: 6.x

**Frontend**:
- React: 18.x
- TypeScript: 5.x
- Vite: 5.x
- Tailwind CSS: 3.x

### C. 포트 설정

```
Backend: 8080
Frontend: 5173 (개발), 3000 (배포)
Database: 3306
```

### D. 유용한 명령어

```bash
# Backend
mvn clean install          # 빌드
mvn spring-boot:run       # 실행
mvn test                  # 테스트

# Frontend
npm install               # 의존성 설치
npm run dev              # 개발 서버
npm run build            # 프로덕션 빌드
npm run preview          # 빌드 미리보기

# Database
mysql -u root -p         # MySQL 접속
SHOW DATABASES;          # DB 목록
USE newtag;              # DB 선택
SHOW TABLES;             # 테이블 목록
```
