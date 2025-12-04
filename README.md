# 🏷️ NewTag (AI 기반 중고거래 플랫폼)

- **NewTag 홈페이지 : https://newtag.store**
- **Container Registry : Naver Cloud Platform Container Registry**
- **Object Storage : Naver Cloud Platform Object Storage (이미지 및 정적 파일)**
- NewTag는 사용자 간의 안전하고 편리한 중고거래를 지원하는 **위치 기반 플랫폼**입니다. **AI 기반 자동 상품 등록**, **실시간 채팅**, **리셀 가격 예측 시스템** 등의 혁신적인 기능을 통해 더 나은 거래 경험을 제공합니다.

---

## 🧩 버전 업데이트

- **1.0.0 Version (2025-12-02)**
  - **NewTag 1.0.0 Version 서비스 개발 완료**
  - AI 기반 자동 상품 등록 (Google Vision API + Gemini AI)
  - 위치 기반 상품 검색 및 필터링 기능
  - 실시간 채팅 및 이미지 전송 기능 (Firebase Firestore)
  - 리셀 가격 예측 시스템 (TSMixer 시계열 모델)
  - 소셜 로그인 (카카오, 구글, 네이버)
  - 사용자 신뢰도 시스템 및 후기 관리
  - 검색 로그 수집 및 인기 검색어 분석
  - Docker 기반 마이크로서비스 아키텍처

---

## 🧑‍💻 역할

| 이름 | 역할 |
| --- | --- |
| 이준범 |  |
| 김경민 |  |
| 전신혁 | Full-Stack, AI Modeling, Prompt Engineer, MLOps Engineer, Vision & Multimodal |
| 김현수 |  |

---

## 🌟 주요 기능

### 1. AI 기반 자동 상품 등록
- **이미지 기반 상품 정보 추출**: Google Vision API를 통한 객체, 브랜드, 색상, 텍스트 인식
- **AI 생성 상품 설명**: Gemini AI가 상품명, 상세 설명, 예상 가격, 카테고리 자동 생성
- **금지 품목 필터링**: 위험 물질, 불법 품목 자동 차단
- **이미지 최적화**: 자동 리사이징 및 압축 (최대 512x512, JPEG 82% 품질)

### 2. 상품 거래
- **상품 등록**: 일반 등록 또는 AI 자동 등록 선택 가능
- **다중 이미지 업로드**: 최대 100MB, 여러 장 업로드 지원
- **카테고리 분류**: 전자기기, 의류, 생활용품 등
- **상품 상태 관리**: 판매중, 예약중, 거래완료
- **위치 기반 거래**: 지도에서 거래 위치 선택
- **조회수 추적**: 실시간 조회수 집계

### 3. 검색 및 필터링
- **키워드 검색**: 상품명, 설명, 판매자 닉네임 검색
- **위치 기반 검색**: 반경 내 상품 검색 (거리순 정렬)
- **카테고리 필터**: 카테고리별 상품 조회
- **정렬 옵션**: 최신순, 가격순, 인기순
- **인기 검색어**: 실시간 인기 검색어 TOP N
- **최근 검색어**: 개인별 최근 검색 기록

### 4. 실시간 채팅
- **Firebase Firestore 기반**: 실시간 메시지 동기화
- **1:1 채팅**: 상품별 구매자-판매자 채팅방 자동 생성
- **이미지 전송**: 채팅 중 이미지 업로드 및 공유
- **읽음 처리**: 읽지 않은 메시지 알림
- **채팅 목록**: 구매자/판매자별 채팅방 관리

### 5. 거래 및 리뷰
- **거래 완료 프로세스**: 구매자 선택 후 거래 완료 처리
- **리뷰 시스템**: 거래 완료 후 1회 리뷰 작성 (1~5점 평점 + 후기)
- **신뢰도 관리**: 리뷰 기반 사용자 신뢰도 점수
- **거래 내역 조회**: 구매 내역 및 판매 내역 확인

### 6. 찜하기 및 관심목록
- **찜하기 토글**: 원터치로 관심 상품 저장/제거
- **찜 목록 관리**: 내가 찜한 상품 모아보기
- **찜 개수 표시**: 실시간 찜 개수 확인

### 7. 리셀 가격 예측 시스템
- **KREAM 데이터 크롤링**: Selenium CDP 기반 거래 내역 수집
- **TSMixer 시계열 모델**: 7일 후 가격 예측
- **급등/급락 예측**: 오늘의 급등/급락 예측 TOP 3 상품 표시
- **가격 추이 차트**: Recharts를 통한 실시간 가격 변동 시각화
- **브랜드 필터링**: 브랜드별 리셀 상품 검색

### 8. 소셜 로그인
- **OAuth 2.0 통합**: 카카오, 구글, 네이버 로그인
- **JWT 기반 인증**: Access Token (15분) + Refresh Token (7일)
- **자동 토큰 갱신**: 만료 시 자동 토큰 재발급

### 9. 주소 관리
- **주소 등록**: 위치명, 위도, 경도 저장
- **기본 주소 설정**: 주소 중 하나를 기본 주소로 지정
- **주소 수정/삭제**: 언제든지 주소 정보 변경 가능

---

## 🔍 프로젝트 핵심 기술 및 버전

### Backend
- **Programming Language**: Java 17
- **Framework**: Spring Boot 3.4.10
- **Database**: MySQL 8.0
- **Authentication**: JWT 0.12.6, OAuth 2.0 (Spring Security)
- **ORM**: JPA (Hibernate)
- **Image Processing**: Thumbnailator 0.4.20
- **Build Tool**: Maven
- **Version Control**: Git, Github

### Frontend
- **Programming Language**: TypeScript 5.7.3
- **Framework**: React 18.3.1
- **Build Tool**: Vite 6.0.0
- **Styling**: TailwindCSS 3.4.16, Autoprefixer
- **UI Components**:
  - Radix UI (접근성 중심 컴포넌트)
  - shadcn/ui (커스텀 UI 시스템)
  - Lucide React (아이콘)
- **Routing**: React Router DOM 7.9.6
- **State Management**: React Hook Form 7.66.0
- **HTTP Client**: Axios 1.7.9
- **Charts**: Recharts 3.3.0
- **Carousel**: Embla Carousel 8.6.0

### AI Model
- **Framework**: FastAPI, Uvicorn
- **Image Processing**: Pillow (PIL) ≥ 10.3.0
- **AI Services**:
  - Google Cloud Vision API (이미지 분석)
  - Google Gemini AI (gemini-2.0-flash) (텍스트 생성)
- **Price Prediction**: TSMixer (시계열 예측)
- **Web Scraping**:
  - Selenium (CDP 기반)
  - BeautifulSoup4
  - Requests

### Infrastructure
- **Cloud Platform**: Naver Cloud Platform
  - Container Registry (Docker 이미지 저장소)
  - Object Storage (정적 파일 및 이미지 저장)
- **Real-time Database**: Firebase Firestore 11.10.0
- **Reverse Proxy**: Caddy 2 Alpine (HTTPS 자동 인증서)
- **Containerization**: Docker, Docker Compose
- **Browser Automation**: Selenium Standalone Chrome
- **Domain**: newtag.store

---

## 🛠️ 설치 방법

### 1️⃣ 저장소 클론
```bash
git clone https://github.com/[your-username]/NewTag.git
cd NewTag
```

### 2️⃣ 환경 변수 설정

#### Backend (.env)
```properties
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=Insa6_aiservice_p3_5
DB_USERNAME=root
DB_PASSWORD=your_password

# JWT
JWT_SECRET_KEY=your_jwt_secret_key_min_256bits

# OAuth
KAKAO_CLIENT_ID=bf5d20743fdd4d4c160dcc583d445d02
KAKAO_CLIENT_SECRET=your_kakao_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_secret
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_secret

# AI Model
AI_LISTING_BASE_URL=http://localhost:8000

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:*
```

#### Frontend (.env)
```properties
# API Base URL
VITE_API_BASE_URL=http://localhost:8081/api/v1

# Firebase
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

#### AI Model (.env)
```properties
GOOGLE_VISION_KEY=your_google_vision_api_key
GEMINI_API_KEY=your_gemini_api_key
STATIC_ROOT=/app/uploads
```

### 3️⃣ 데이터베이스 마이그레이션
```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE Insa6_aiservice_p3_5 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# DDL 실행
USE Insa6_aiservice_p3_5;
SOURCE DDL.sql;

# (선택) 초기 데이터 삽입
SOURCE DML.sql;
```

### 4️⃣ Docker Compose로 전체 실행 (권장)

#### 프로덕션 배포 (Naver Cloud Container Registry 사용)
```bash
# Naver Cloud Container Registry에서 이미지 Pull & 실행
docker-compose pull
docker-compose up -d


# 로그 확인
docker-compose logs -f

# 서비스 중지
docker-compose down
```
#### 로컬 개발 환경 (이미지 빌드)
```bash
# docker-compose.yml에서 build 섹션 활성화 필요
# image: pynchomo/newtag-frontend:latest 주석 처리
# build: context: ./FrontEnd/NewTag 주석 해제

# 모든 서비스 빌드 및 실행
docker-compose up --build -d

# 특정 서비스만 재빌드
docker-compose up --build -d frontend
docker-compose up --build -d backend
docker-compose up --build -d model
```

#### 로컬 개발 환경 (이미지 빌드)
```bash
# docker-compose.yml에서 build 섹션 활성화 필요
# image: pynchomo/newtag-frontend:latest 주석 처리
# build: context: ./FrontEnd/NewTag 주석 해제

# 모든 서비스 빌드 및 실행
docker-compose up --build -d

# 특정 서비스만 재빌드
docker-compose up --build -d frontend
docker-compose up --build -d backend
docker-compose up --build -d model
```

### 5️⃣ 개별 서비스 실행 (로컬 개발)

#### Backend
```bash
cd BackEnd
mvn clean install
mvn spring-boot:run
# 또는 IDE에서 NewTagApplication.java 실행
```

#### Frontend
```bash
cd FrontEnd/NewTag
npm install
npm run dev
```

#### AI Model Server
```bash
cd model/img_model
pip install -r requirements.txt
python api_server.py
```

#### Price Prediction Crawler (선택)
```bash
cd model/crawling
pip install -r requirements.txt

# 전체 실행 (크롤링 + 예측 + 피드 생성)
python super_kream_crawling.py

# 크롤링만
python super_kream_crawling.py --no-predict

# 피드만 생성 (기존 데이터 재사용)
python super_kream_crawling.py --feed-only
```

### 6️⃣ 접속 확인

#### 프로덕션 환경
- **프론트엔드**: https://newtag.store
- **백엔드 API**: https://newtag.store/api/v1
- **AI 모델 API**: https://newtag.store/api/v1/model

#### 로컬 개발 환경
- **프론트엔드**: http://localhost (Caddy) 또는 http://localhost:5173 (Vite 개발 서버)
- **백엔드 API**: http://localhost:8081
- **AI 모델 API**: http://localhost:8000
- **Selenium VNC**: http://localhost:7900 (비밀번호: secret)

---

## 🖇️ 화면 설계서
https://www.canva.com/design/DAG1uattvQk/fWB4eOKmCOApB0QmXWS_7g/edit


---

## 📋 API 명세서

### 인증 (`/v1`)
| 기능 | HTTP 메서드 | 엔드포인트 | 설명 |
| --- | --- | --- | --- |
| 회원가입 | POST | `/v1/signup` | 일반 회원가입 |
| 로그인 | POST | `/v1/login` | 로컬 로그인 (JWT 발급) |
| 토큰 갱신 | POST | `/v1/auth/refresh` | Access Token 재발급 |
| 로그아웃 | POST | `/v1/logout` | 로그아웃 (토큰 제거) |
| 카카오 로그인 콜백 | GET | `/v1/auth/kakao/callback` | 카카오 OAuth 콜백 |
| 구글 로그인 콜백 | GET | `/v1/auth/google/callback` | 구글 OAuth 콜백 |
| 네이버 로그인 콜백 | GET | `/v1/auth/naver/callback` | 네이버 OAuth 콜백 |
| 내 정보 조회 | GET | `/v1/auth/me` | 현재 로그인 사용자 정보 |
| 프로필 수정 | PUT | `/v1/update` | 사용자 정보 수정 |
| 이메일 중복 확인 | GET | `/v1/emailMatch` | 이메일 사용 가능 여부 |
| 닉네임 중복 확인 | GET | `/v1/idMatch` | 닉네임 사용 가능 여부 |
| 판매자 프로필 조회 | GET | `/v1/sellers/{sellerId}` | 특정 판매자 정보 조회 |

### 상품 (`/v1/products`)
| 기능 | HTTP 메서드 | 엔드포인트 | 설명 |
| --- | --- | --- | --- |
| 상품 목록 조회 | GET | `/v1/products` | 카테고리/정렬/페이징 |
| 상품 상세 조회 | GET | `/v1/products/{id}` | 특정 상품 상세 정보 |
| 연관 상품 조회 | GET | `/v1/products/{id}/related` | 같은 카테고리 연관 상품 |
| 판매자 다른 상품 | GET | `/v1/products/{id}/seller-other` | 같은 판매자 다른 상품 |
| 상품 검색 | GET | `/v1/products/search` | 키워드 기반 검색 |
| 위치 기반 상품 조회 | GET | `/v1/products/location` | 반경 내 상품 검색 |
| 판매자별 상품 | GET | `/v1/products/seller/{sellerId}` | 특정 판매자 상품 목록 |
| 내 상품 조회 | GET | `/v1/products/my` | 로그인 사용자 상품 |
| 상품 등록 (JSON) | POST | `/v1/products` | JSON 형식 상품 등록 |
| 상품 등록 (Multipart) | POST | `/v1/products` | 파일 업로드 포함 등록 |
| 상품 수정 | PUT | `/v1/products/{id}` | 상품 정보 수정 |
| 상품 삭제 | DELETE | `/v1/products/{id}` | 소프트 삭제 |
| 상품 상태 변경 | PATCH | `/v1/products/{id}/status` | 상태 변경 (판매중/예약중/완료) |
| 거래 완료 | POST | `/v1/products/{id}/complete` | 거래 완료 처리 |
| 조회수 증가 | POST | `/v1/products/{id}/view` | 조회수 +1 |
| 찜하기 토글 | POST | `/v1/products/{id}/favorite` | 찜 추가/제거 |
| 찜 목록 조회 | GET | `/v1/products/favorites` | 내가 찜한 상품 |
| 인기 검색어 | GET | `/v1/products/search/popular` | 실시간 인기 검색어 |
| 최근 검색어 | GET | `/v1/products/search/recent` | 내 최근 검색어 |
| 최근 검색어 삭제 | DELETE | `/v1/products/search/recent` | 특정 검색어 삭제 |
| 전체 검색어 삭제 | DELETE | `/v1/products/search/recent/all` | 모든 검색어 삭제 |

### AI (`/v1/ai`)
| 기능 | HTTP 메서드 | 엔드포인트 | 설명 |
| --- | --- | --- | --- |
| AI 자동 상품 등록 | POST | `/v1/ai/auto-listing` | 이미지 기반 자동 등록 |

### 파일 업로드 (`/v1/uploads`)
| 기능 | HTTP 메서드 | 엔드포인트 | 설명 |
| --- | --- | --- | --- |
| 이미지 업로드 | POST | `/v1/uploads/images` | 일반 이미지 업로드 |
| URL 이미지 가져오기 | POST | `/v1/uploads/fetch` | URL에서 이미지 다운로드 |
| 프로필 이미지 업로드 | POST | `/v1/uploads/profile` | 프로필 사진 업로드 |
| 채팅 이미지 업로드 | POST | `/v1/uploads/chat` | 채팅 이미지 업로드 |

### 리뷰 (`/v1/reviews`)
| 기능 | HTTP 메서드 | 엔드포인트 | 설명 |
| --- | --- | --- | --- |
| 리뷰 작성 | POST | `/v1/reviews` | 거래 후기 작성 |
| 리뷰 조회 | GET | `/v1/reviews/user/{userId}` | 특정 사용자 리뷰 목록 |
| 리뷰 존재 확인 | GET | `/v1/reviews/exists` | 리뷰 작성 여부 확인 |
| 평점 요약 | GET | `/v1/reviews/user/{userId}/summary` | 평균 평점 및 개수 |

### 주소 (`/v1/addresses`)
| 기능 | HTTP 메서드 | 엔드포인트 | 설명 |
| --- | --- | --- | --- |
| 주소 목록 | GET | `/v1/addresses` | 내 주소 목록 |
| 주소 추가 | POST | `/v1/addresses` | 새 주소 등록 |
| 주소 수정 | PUT | `/v1/addresses/{addressId}` | 주소 정보 수정 |
| 주소 삭제 | DELETE | `/v1/addresses/{addressId}` | 주소 삭제 |
| 기본 주소 조회 | GET | `/v1/addresses/default` | 기본 주소 조회 |
| 기본 주소 설정 | PUT | `/v1/addresses/{addressId}/default` | 기본 주소로 설정 |

### 카테고리 (`/v1/categories`)
| 기능 | HTTP 메서드 | 엔드포인트 | 설명 |
| --- | --- | --- | --- |
| 전체 카테고리 | GET | `/v1/categories` | 모든 카테고리 조회 |
| 카테고리 ID 조회 | GET | `/v1/categories/{id}` | 특정 카테고리 정보 |

### 찜하기 (`/v1/favorites`)
| 기능 | HTTP 메서드 | 엔드포인트 | 설명 |
| --- | --- | --- | --- |
| 찜하기 토글 | POST | `/v1/favorites/{productId}` | 찜 추가/제거 |
| 찜 상태 확인 | GET | `/v1/favorites/{productId}/status` | 찜 여부 및 개수 |
| 내 찜 목록 | GET | `/v1/favorites/my-products` | 내가 찜한 상품 |

### 거래 (`/v1/purchase`)
| 기능 | HTTP 메서드 | 엔드포인트 | 설명 |
| --- | --- | --- | --- |
| 구매 내역 | GET | `/v1/purchase` | 구매 내역 조회 |

---

## 🖼️ ERD (Entity Relationship Diagram)

### ERD 이미지
<img width="2000" height="1446" alt="newtag_erd_edit" src="https://github.com/user-attachments/assets/11c3b551-7772-4343-88b5-2b112fc6b02a" />



### 주요 테이블
- **user**: 사용자 정보, 소셜 로그인, 신뢰도
- **address**: 사용자 위치 (위도/경도)
- **product**: 상품 정보, 상태, 리셀 여부
- **product_image**: 상품 이미지 (다중 이미지 지원)
- **category**: 상품 카테고리
- **favorite**: 찜하기
- **transaction**: 거래 내역 및 상태
- **review**: 거래 후기 및 평점
- **search_log**: 검색 로그 (키워드, 클릭, 디바이스)

---

## 🌍 시스템 아키텍처

### 프로덕션 환경 (Naver Cloud Platform)

```
[사용자]
   ↓
[newtag.store] (HTTPS/SSL)
        ↓
[Caddy Reverse Proxy :80/:443]
   ↓
   ├─ /api/v1/model/* → [AI Model Container :8000]
   ├─ /api/* → [Backend Container :8081]
   └─ /* → [Frontend Container :80]

[Naver Cloud Container Registry]
   ├─ pynchomo/newtag-frontend:latest
   ├─ pynchomo/newtag-backend:latest
   └─ pynchomo/newtag-model:latest

[Naver Cloud Object Storage]
   └─ 정적 파일 (이미지, 업로드 파일)

[External Services]
   ├─ [Firebase Firestore] (실시간 채팅)
   ├─ [Google Cloud Vision API] (이미지 분석)
   ├─ [Google Gemini API] (AI 텍스트 생성)
   └─ [Selenium Container] (크롤링)
```

### 로컬 개발 환경

```
[localhost]
   ↓
[Caddy :80] (Reverse Proxy)
        ↓
   ┌────┴────┬─────────┬──────────┬─────────┐
   ↓         ↓         ↓          ↓         ↓
[Frontend] [Backend] [AI Model] [Crawler] [Selenium]
  (React)  (Spring)  (FastAPI)  (Python)  (Chrome)
   :80      :8081     :8000      -         :4444
                                            :7900 (VNC)
   ↑                   ↑          ↑          ↑
   │                   │          │          │
   └─────uploads───────┘          │          │
                                  └──────────┘
                            (Browser Automation)
```

### Caddy 라우팅 규칙
1. `/api/v1/model/*` → AI Model Server (:8000)
2. `/api/*` → Backend API (:8081)
3. `/*` → Frontend (:80)

### 데이터 흐름
1. **사용자 → Caddy → 적절한 서비스**
2. **AI 상품 등록**: Frontend → Backend → AI Model → Google APIs → Backend → Frontend
3. **채팅**: Frontend ↔ Firebase Firestore (실시간)
4. **크롤링**: Crawler → Selenium → KREAM → 데이터 저장
5. **가격 예측**: Python 스크립트 → 크롤링 데이터 분석 → resell_auto.json 생성

---

## 🚀 배포 (Naver Cloud Platform)

### Container Registry 설정

#### 1. Docker 이미지 빌드 및 푸시
```bash
# 로그인
docker login pynchomo

# Frontend 이미지 빌드 & 푸시
cd FrontEnd/NewTag
docker build -t pynchomo/newtag-frontend:latest .
docker push pynchomo/newtag-frontend:latest

# Backend 이미지 빌드 & 푸시
cd ../../BackEnd
docker build -t pynchomo/newtag-backend:latest .
docker push pynchomo/newtag-backend:latest

# AI Model 이미지 빌드 & 푸시
cd ../model/img_model
docker build -t pynchomo/newtag-model:latest .
docker push pynchomo/newtag-model:latest
```

#### 2. 서버에서 배포
```bash
# 서버 접속 후
cd /path/to/NewTag

# 최신 이미지 Pull
docker-compose pull

# 서비스 재시작
docker-compose down
docker-compose up -d

# 로그 확인
docker-compose logs -f
```

### Object Storage 설정

#### Naver Cloud Object Storage 연동
```bash
# Backend 환경변수 설정 (BackEnd/.env)
NCLOUD_OBJECT_STORAGE_ENDPOINT=https://kr.object.ncloudstorage.com
NCLOUD_OBJECT_STORAGE_REGION=kr-standard
NCLOUD_ACCESS_KEY=your_access_key
NCLOUD_SECRET_KEY=your_secret_key
NCLOUD_BUCKET_NAME=newtag-storage
```

#### 이미지 업로드 처리
- 사용자가 업로드한 이미지는 Naver Cloud Object Storage에 저장
- 공개 URL을 통해 이미지 접근
- CDN 연동으로 빠른 이미지 로딩

### SSL/TLS 인증서

Caddy가 Let's Encrypt를 통해 자동으로 SSL 인증서 발급 및 갱신:
```caddyfile
# Caddyfile
newtag.store {
    # 자동 HTTPS 활성화
    reverse_proxy frontend:80
}
```

### 도메인 설정

1. **DNS 설정**: newtag.store → Naver Cloud 서버 IP
2. **A 레코드 추가**: `@` → 서버 공인 IP
3. **CNAME 레코드** (선택): `www` → `newtag.store`

### 배포 체크리스트

- [x] Container Registry에 Docker 이미지 푸시
- [x] Object Storage 버킷 생성 및 권한 설정
- [x] 환경 변수 파일 (.env) 서버에 업로드
- [x] 도메인 DNS 설정
- [x] Caddy HTTPS 자동 인증서 확인
- [x] 방화벽 규칙 설정 (80, 443 포트 개방)
- [x] Docker Compose 서비스 실행
- [x] 로그 모니터링 설정

### 배포 모니터링

```bash
# 컨테이너 상태 확인
docker-compose ps

# 실시간 로그 확인
docker-compose logs -f

# 특정 서비스 로그
docker-compose logs -f backend

# 리소스 사용량 확인
docker stats

# 컨테이너 재시작
docker-compose restart backend
```

---

## 🔐 보안

- **HTTPS**: 프로덕션 환경에서 Caddy 자동 SSL 인증서
- **JWT 인증**:
  - Access Token: 15분 (900,000ms)
  - Refresh Token: 7일 (604,800,000ms) - HttpOnly Cookie
- **비밀번호 암호화**: BCrypt 해시
- **OAuth 2.0**: Kakao, Google, Naver
- **CORS**: localhost 허용
- **파일 업로드 검증**: 타입, 크기 제한
- **금지 품목 필터링**: AI 등록 시 위험 물질 차단

---

## 👀 트러블슈팅

> 상세한 코드 및 분석은 [TROUBLESHOOTING_SUMMARY.md](TROUBLESHOOTING_SUMMARY.md) 및 [docs/](docs/) 폴더를 참고하세요.

### 1. 초기 500/403 에러 및 로그인 실패

#### 1.1. 데이터베이스 연결 문제 (SSL/TLS 오류)
- **원인**: 데이터베이스 서버가 자체 서명 인증서를 사용하여 SSL 연결 실패 (`TLS/SSL error: self-signed certificate in certificate chain`)
- **해결**: `application.properties`의 `spring.datasource.url`에 `useSSL=false` 파라미터 추가
- **진단 방법**: 백엔드 컨테이너 내에 `mysql-client` 설치 후 직접 DB 연결 테스트

#### 1.2. API 경로 불일치 문제
- **원인**:
  - 프론트엔드: `/api/v1/...` 호출
  - Caddy: `handle_path /api/*` 규칙으로 `/api/` 제거 → `/v1/...`로 전달
  - 백엔드: `@RequestMapping("/api/v1/...")` 설정 → `/v1/...` 요청 처리 불가 → `NoResourceFoundException` 발생 (500 에러로 변환)
- **해결**: 모든 백엔드 컨트롤러(`UserController`, `ProductController`, `AiController` 등)에서 `/api` 접두사 제거, `/v1`으로 통일
- **영향 파일**: `UserController`, `ProductController`, `AiController`, `WebMvcConfig`

### 2. 소셜 로그인(OAuth) 실패

#### 2.1. Redirect URI 경로 불일치
- **원인**: 백엔드(`application.properties`), 프론트엔드(`auth.ts`), 카카오 개발자 콘솔 세 곳의 Redirect URI 불일치
- **해결**:
  1. 프론트엔드 전용 콜백 경로와 백엔드 API 경로 명확히 분리
  2. 최종적으로 모든 경로를 `http://localhost/api/v1/auth/kakao/callback`으로 통일
  3. 카카오 개발자 콘솔에도 동일 주소 등록
- **영향 파일**: `application.properties`, `auth.ts`, `App.tsx`

#### 2.2. Client ID 불일치
- **원인**: 프론트엔드 `.env`의 `VITE_KAKAO_CLIENT_ID`에 JavaScript 키 사용 (OAuth에는 REST API 키 필요)
- **해결**: `VITE_KAKAO_CLIENT_ID`를 **REST API 키**로 변경
- **에러 증상**: `400 Bad Request`

### 3. AI 자동작성 기능 500 에러

#### 3.1. Caddy 라우팅 문제
- **원인**: `handle_path /api/*` 규칙으로 AI 요청이 `model` 서버 대신 `backend`로 전달
- **해결**: `Caddyfile`에 `/api/v1/model/*` 경로를 `model:8000`으로 라우팅하는 우선 규칙 추가
- **영향 파일**: `Caddyfile`, `postApi.ts`

#### 3.2. API 페이로드 형식 불일치
- **원인**:
  - 모델 서버 기대: `{"image_paths": [...]}`
  - 프론트엔드 전송: `[...]` (배열 직접 전송)
- **해결**: `postApi.ts`의 `autoWrite` 함수에서 `{"image_paths": imagePaths}` 객체로 감싸서 전송
- **에러 증상**: `422 Unprocessable Entity`

### 4. 조회수(viewCount) 미증가 및 0으로 표시

#### 4.1. API 호출 누락
- **원인**: `ProductDetailPage.tsx`에서 조회수 증가 API(`incrementViewCount`) 호출 로직 누락
- **해결**: `useEffect` 내에 `productsApi.incrementViewCount` 호출 추가

#### 4.2. 프론트엔드 타입 에러
- **원인**: `incrementViewCount` 함수가 `productsApi`에 정의되어 있으나 `productApi`에서 호출
- **해결**: 올바른 import 경로 수정 및 호출 후 `viewCount` 상태 업데이트

### 5. 마이페이지 채팅 개수 목업 데이터 문제
- **원인**: "관심목록", "판매 중인 상품" 목록에서 `chatCount` 대신 `viewCount` 사용
- **해결**:
  1. 별도 `myPageApi.ts` 파일 생성
  2. `chatRoomsApi.getChatRoomCountsByProducts` 호출하여 실제 채팅 개수 매핑
- **영향 파일**: `MyPage.tsx`, `myPageApi.ts` (신규)

### 6. 검색 기능 `Connection is read-only` 에러
- **원인**:
  - `ProductService` 클래스 레벨에 `@Transactional(readOnly = true)` 설정
  - `searchProducts` 메서드가 검색 로그 저장(INSERT) 쓰기 작업 포함
  - 읽기 전용 트랜잭션에서 쓰기 작업 시도
- **해결**: `ProductService.searchProducts` 메서드에 별도 `@Transactional` 어노테이션 추가 (쓰기 가능)
- **에러 증상**: `500 Internal Server Error` → `200 OK`

### 7. 시간 표시 형식 한글화
- **원인**: `ProductService.getTimeAgo` 메서드가 "m ago", "h ago" 등 영어로 하드코딩
- **해결**: 반환 값을 "분 전", "시간 전" 등 한글로 수정
- **영향 범위**: API 응답의 `timeAgo` 필드

### 8. AI 자동작성 422 에러 - Body 전송 실패

#### 8.1. HTTP/2 업그레이드 문제
- **원인**: Spring RestTemplate이 HTTP/2 업그레이드를 시도하면서 request body 미전송
- **증상**: `422 Unprocessable Entity - Field required: body`
- **해결**: `RestClientConfig`에서 `SimpleClientHttpRequestFactory` 사용하여 HTTP/1.1 강제
```java
@Bean
public RestTemplate restTemplate(RestTemplateBuilder builder) {
    SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
    factory.setConnectTimeout(5000);
    factory.setReadTimeout(30000);
    return builder.requestFactory(() -> factory).build();
}
```

#### 8.2. 이미지 경로 불일치
- **원인**: Python 서버의 `STATIC_ROOT` 환경 변수 미로드
- **증상**: `Image not found: C:\Users\...\static\...`
- **해결**:
  1. `api_server.py`에서 `.env` 파일 명시적 로드 (`bootstrap_env()`)
  2. 프로젝트 구조 기반 동적 경로 계산 구현
  3. 팀원 간 경로 호환성 확보 (절대 경로 하드코딩 제거)

### 9. N+1 쿼리 문제로 인한 성능 저하

#### 9.1. 메인페이지 상품 목록 로딩 지연
- **원인**: 각 상품마다 개별적으로 찜 개수 조회 (1 + N번의 쿼리)
- **증상**: 30개 상품 조회 시 31번의 쿼리 발생, 응답 시간 3-10초
- **해결**: 일괄 조회 메서드 구현
  1. `FavoriteRepository.countByProductIds()` 추가 (IN 절 + GROUP BY)
  2. `FavoriteService.getFavoriteCounts()` 일괄 조회 로직
  3. `ProductService` 최적화 - Map 기반 O(1) 조회
- **성능 개선**:
  - 쿼리 수: 31개 → 2개 (93.5% 감소)
  - 응답 시간: 5초 → 0.3초 (94% 단축)
  - 동시 처리 가능 요청 수: 10개 → 50개 (5배 증가)

#### 9.2. Batch Fetch Size 최적화
- **원인**: JPA LAZY 로딩으로 연관 엔티티 접근 시 추가 쿼리 발생
- **해결**: `application.properties`에 설정 추가
```properties
spring.jpa.properties.hibernate.default_batch_fetch_size=100
```
- **효과**: 81개 쿼리 → 5개 쿼리 (93.8% 감소), 응답 시간 350ms → 90ms

#### 9.3. 프론트엔드 무한 스크롤 구현
- **원인**: 초기에 100개 상품 한 번에 로드하여 로딩 시간 과다
- **해결**: Intersection Observer API 사용한 무한 스크롤 구현
  - 초기 로드: 30개
  - 추가 로드: 10개씩
- **효과**: 초기 로딩 시간 10초 → 0.5초 (95% 단축)

### 10. 권장 추가 최적화

#### 10.1. 데이터베이스 인덱스
```sql
CREATE INDEX idx_favorite_product_id ON favorite(product_id);
CREATE INDEX idx_product_category ON product(category_id) WHERE is_delete = false;
CREATE INDEX idx_product_created_at ON product(created_at DESC) WHERE is_delete = false;
```

#### 10.2. 읽기 전용 트랜잭션
```java
@Transactional(readOnly = true)  // flush 생략으로 성능 향상
public Page<ProductDtos.ListItem> getProductList(...) { }
```

---

## 📚 상세 문서

### 구현 가이드
- **[PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md)** - 프로젝트 구조 및 아키텍처
- **[AUTH_SYSTEM_INTEGRATION.md](docs/AUTH_SYSTEM_INTEGRATION.md)** - 소셜 로그인 및 JWT 인증
- **[KAKAO_MAP_IMPLEMENTATION.md](docs/KAKAO_MAP_IMPLEMENTATION.md)** - 카카오 맵 API 통합

### 트러블슈팅 상세
- **[TROUBLESHOOTING_SUMMARY.md](TROUBLESHOOTING_SUMMARY.md)** - 전체 트러블슈팅 요약
- **[docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** - 상세 가이드 및 코드
- **[docs/AI_AUTO_WRITE_TROUBLESHOOTING.md](docs/AI_AUTO_WRITE_TROUBLESHOOTING.md)** - AI 자동 작성 상세 분석
- **[docs/N+1_QUERY_ANALYSIS.md](docs/N+1_QUERY_ANALYSIS.md)** - N+1 쿼리 문제 분석
- **[docs/N+1_QUERY_OPTIMIZATION_RESULTS.md](docs/N+1_QUERY_OPTIMIZATION_RESULTS.md)** - 최적화 결과 보고서

---

## 📞 문의

- GitHub: https://github.com/KimGyoungmin/NewTag
- Email: [이메일 주소 추가 예정]

---

## 📄 라이센스

This project is licensed under the MIT License.

---

**마지막 업데이트**: 2025-12-02
