# 프로덕션 환경 소셜 로그인 수정 가이드

## 🔴 문제 상황
- 배포 환경에서 소셜 로그인 버튼 클릭 시 `ERR_SSL_PROTOCOL_ERROR` 발생
- 콜백 URL이 `https://localhost/api/v1/auth/kakao/callback`로 리다이렉트됨
- 정상 URL: `https://newtag.store/api/v1/auth/kakao/callback`

## 🔍 원인
환경 변수 `DOMAIN_NAME`과 `VITE_DOMAIN_NAME`이 설정되지 않아 기본값 `localhost` 사용

## ✅ 해결 방법

### 1단계: 백엔드 환경 변수 설정

**파일**: `BackEnd/.env`

```properties
# 기존 내용에 추가
DOMAIN_NAME=newtag.store

# 전체 OAuth 설정 예시
KAKAO_CLIENT_ID=your_kakao_rest_api_key
KAKAO_CLIENT_SECRET=your_kakao_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_secret
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_secret
DOMAIN_NAME=newtag.store
```

### 2단계: 프론트엔드 환경 변수 설정

**파일**: `FrontEnd/NewTag/.env`

```properties
# API Base URL
VITE_API_BASE_URL=https://newtag.store/api/v1

# Domain Name (소셜 로그인 콜백 URL용)
VITE_DOMAIN_NAME=https://newtag.store

# OAuth Client IDs
VITE_KAKAO_CLIENT_ID=your_kakao_rest_api_key
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_NAVER_CLIENT_ID=your_naver_client_id

# Firebase
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3단계: 카카오 개발자 콘솔 설정

#### Redirect URI 등록
1. https://developers.kakao.com 접속
2. 내 애플리케이션 선택
3. **앱 설정** → **플랫폼** → **Web 플랫폼**
   - 사이트 도메인: `https://newtag.store` 등록

4. **제품 설정** → **카카오 로그인** → **Redirect URI**
   - `https://newtag.store/api/v1/auth/kakao/callback` 추가
   - **기존 localhost URI는 유지** (로컬 개발용)

#### Redirect URI 목록 (권장)
```
https://newtag.store/api/v1/auth/kakao/callback
http://localhost/api/v1/auth/kakao/callback
http://localhost:5173/api/v1/auth/kakao/callback
```

### 4단계: 구글 OAuth 콘솔 설정

1. https://console.cloud.google.com 접속
2. **API 및 서비스** → **사용자 인증 정보**
3. OAuth 2.0 클라이언트 ID 선택
4. **승인된 리디렉션 URI** 추가:
   - `https://newtag.store/api/v1/auth/google/callback`

### 5단계: 네이버 개발자 센터 설정

1. https://developers.naver.com/apps 접속
2. 내 애플리케이션 선택
3. **API 설정** → **서비스 URL**
   - `https://newtag.store` 등록
4. **Callback URL** 추가:
   - `https://newtag.store/api/v1/auth/naver/callback`

### 6단계: Docker 이미지 재빌드 및 배포

#### 방법 1: 환경 변수만 업데이트 (빠름)
```bash
# 서버에서 .env 파일 수정 후
docker-compose down
docker-compose up -d

# 또는 특정 서비스만 재시작
docker-compose restart backend
docker-compose restart frontend
```

#### 방법 2: 이미지 재빌드 (권장 - 환경 변수 포함)
```bash
# 로컬에서
cd FrontEnd/NewTag
docker build -t pynchomo/newtag-frontend:latest .
docker push pynchomo/newtag-frontend:latest

cd ../../BackEnd
docker build -t pynchomo/newtag-backend:latest .
docker push pynchomo/newtag-backend:latest

# 서버에서
docker-compose pull
docker-compose down
docker-compose up -d
```

### 7단계: 브라우저 캐시 클리어

배포 후 브라우저에서:
1. **Ctrl + Shift + Delete** (캐시 삭제)
2. **Ctrl + Shift + R** (하드 리프레시)
3. 또는 시크릿 모드로 테스트

## 🧪 테스트 방법

### 1. 백엔드 환경 변수 확인
```bash
# 컨테이너 내부 환경 변수 확인
docker exec newtag-backend env | grep DOMAIN_NAME
# 출력: DOMAIN_NAME=newtag.store

# application.properties 설정 확인
docker exec newtag-backend cat /app/classes/application.properties | grep redirect-uri
# 출력: kakao.redirect-uri=https://${DOMAIN_NAME:localhost}/api/v1/auth/kakao/callback
```

### 2. 프론트엔드 빌드 확인
```bash
# 빌드된 파일에서 환경 변수 확인
docker exec newtag-frontend cat /usr/share/caddy/index.html | grep -o "newtag.store"
```

### 3. 실제 로그인 테스트
1. https://newtag.store 접속
2. **카카오 로그인** 버튼 클릭
3. 카카오 로그인 페이지로 정상 이동 확인
4. 로그인 후 `https://newtag.store/api/v1/auth/kakao/callback?code=...`로 리다이렉트 확인
5. 최종적으로 메인 페이지로 정상 복귀 확인

## 🔍 문제 해결

### 여전히 localhost로 리다이렉트되는 경우

#### 1. 환경 변수 누락 확인
```bash
# 백엔드
docker exec newtag-backend env | grep DOMAIN_NAME

# 프론트엔드 (빌드 시 포함되어야 함)
docker logs newtag-frontend | grep VITE_DOMAIN_NAME
```

#### 2. 이미지 재빌드 필요
- 프론트엔드는 **빌드 타임**에 환경 변수가 포함됨
- `.env` 파일 수정 후 반드시 재빌드 필요

```bash
# 프론트엔드 재빌드 (중요!)
cd FrontEnd/NewTag
docker build --no-cache -t pynchomo/newtag-frontend:latest .
docker push pynchomo/newtag-frontend:latest
```

#### 3. OAuth 앱 설정 확인
- 카카오/구글/네이버 개발자 콘솔에서 Redirect URI 등록 확인
- 대소문자, 프로토콜(https), 경로 정확히 일치해야 함

#### 4. Caddy 로그 확인
```bash
docker logs newtag-caddy-proxy | tail -50
```

## 📋 체크리스트

배포 전 확인 사항:

- [ ] `BackEnd/.env`에 `DOMAIN_NAME=newtag.store` 추가
- [ ] `FrontEnd/NewTag/.env`에 `VITE_DOMAIN_NAME=https://newtag.store` 추가
- [ ] 카카오 개발자 콘솔에 Redirect URI 등록
- [ ] 구글 OAuth 콘솔에 Redirect URI 등록
- [ ] 네이버 개발자 센터에 Callback URL 등록
- [ ] 프론트엔드 이미지 재빌드 및 푸시
- [ ] 백엔드 이미지 재빌드 및 푸시 (선택)
- [ ] 서버에서 `docker-compose pull` 실행
- [ ] 서버에서 `docker-compose up -d` 실행
- [ ] 브라우저 캐시 클리어
- [ ] 실제 로그인 테스트

## 🎯 예상 결과

### 성공 시
```
사용자 → 카카오 로그인 버튼 클릭
      → https://kauth.kakao.com/oauth/authorize?...&redirect_uri=https://newtag.store/api/v1/auth/kakao/callback
      → 카카오 로그인 페이지
      → 로그인 성공
      → https://newtag.store/api/v1/auth/kakao/callback?code=...
      → 백엔드에서 토큰 발급
      → 메인 페이지로 리다이렉트 (로그인 완료)
```

### 실패 시 로그 확인
```bash
# 백엔드 로그
docker logs newtag-backend -f

# 프론트엔드 로그
docker logs newtag-frontend -f

# Caddy 로그
docker logs newtag-caddy-proxy -f
```

## 📞 추가 지원

문제가 지속되면:
1. 백엔드 로그 확인
2. 브라우저 개발자 도구 Network 탭 확인
3. OAuth 제공자(카카오/구글/네이버) 에러 메시지 확인

---

**마지막 업데이트**: 2025-12-04
