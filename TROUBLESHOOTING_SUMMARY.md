# NewTag 프로젝트 트러블슈팅 요약

이 문서는 NewTag 프로젝트의 Docker Compose 환경 설정 과정에서 발생한 다양한 문제들과 해결 과정을 요약합니다.

---

## 1. 초기 500/403 에러 및 로그인 실패

### 1.1. 문제 상황
- `docker-compose up`으로 모든 컨테이너를 실행했으나, API 요청 시 원인을 알 수 없는 `500 Internal Server Error` 및 `403 Forbidden` 에러 발생.
- 로그인 API가 동작하지 않음.

### 1.2. 해결 과정

#### 1.2.1. 데이터베이스 연결 문제 (SSL/TLS 오류)
- **원인 분석:** `mysql-client`를 백엔드 컨테이너 내에 설치하여 직접 DB 연결을 테스트한 결과, `TLS/SSL error: self-signed certificate in certificate chain` 에러를 확인. 데이터베이스 서버가 자체 서명 인증서를 사용하여 SSL 연결에 실패하고 있었습니다.
- **해결:** `application.properties`의 `spring.datasource.url`에 `useSSL=false` 파라미터를 추가하여 SSL 연결을 비활성화.
  - **변화:** DB 연결 시 SSL 핸드셰이크 에러가 사라짐.

#### 1.2.2. API 경로 불일치 문제
- **원인 분석:**
    1. 프론트엔드는 `/api/v1/...`으로 API를 호출.
    2. Caddy는 `handle_path /api/*` 규칙에 따라 `/api/` 접두사를 제거하고 `/v1/...`을 백엔드로 전달.
    3. 백엔드 컨트롤러는 `@RequestMapping("/api/v1/...")`으로 설정되어 있어, `/v1/...` 경로의 요청을 처리하지 못하고 `NoResourceFoundException` 발생. (이것이 `GlobalExceptionHandler`에 의해 `500 Internal Server Error`로 변환됨)
- **해결:**
    - `UserController`, `ProductController`, `AiController`, `WebMvcConfig` 등 모든 백엔드 경로 매핑에서 `/api` 접두사를 제거하고 `/v1`으로 시작하도록 통일.
  - **변화:** `NoResourceFoundException` 에러가 사라지고, API 요청이 올바른 컨트롤러로 전달되기 시작함.

---

## 2. 소셜 로그인(OAuth) 실패

### 2.1. 문제 상황
- 카카오 로그인 시도 시, 콜백 과정에서 `400 Bad Request` 또는 `403 Forbidden` 에러 발생.

### 2.2. 해결 과정

#### 2.2.1. Redirect URI 경로 불일치
- **원인 분석:** 백엔드(`application.properties`), 프론트엔드(`auth.ts`), 카카오 개발자 콘솔 세 곳의 `Redirect URI` 설정이 서로 일치하지 않았음. 특히 프론트엔드 라우팅 경로와 백엔드 API 경로가 혼재되어 Caddy가 콜백 요청을 잘못 라우팅하는 문제가 있었음.
- **해결:**
    1. 프론트엔드 전용 콜백 경로(예: `http://localhost/auth/kakao/callback`)와 백엔드 API 경로(예: `/api/v1/auth/kakao/callback`)를 명확히 분리.
    2. 프론트엔드(`auth.ts`, `App.tsx`)와 백엔드(`application.properties`)의 `Redirect URI` 설정을 모두 프론트엔드 전용 경로로 통일.
    3. 최종적으로는 Caddy의 동작 방식을 고려하여, **모든 관련 경로를 `http://localhost/api/v1/auth/kakao/callback`으로 통일**하고, 카카오 개발자 콘솔에도 이 주소를 등록하도록 최종 수정.
  - **변화:** `Redirect URI mismatch` 에러가 사라지고 카카오 서버가 콜백을 정상적으로 호출하게 됨.

#### 2.2.2. Client ID 불일치
- **원인 분석:** `400 Bad Request`가 계속 발생하여 확인한 결과, 프론트엔드 `.env` 파일의 `VITE_KAKAO_CLIENT_ID`에 JavaScript 키가 설정되어 있었음. 카카오의 OAuth 인증 시작(`oauth/authorize`) 시에는 **REST API 키**가 필요합니다.
- **해결:** 프론트엔드의 `VITE_KAKAO_CLIENT_ID` 환경 변수 값을 **REST API 키**로 수정하도록 안내.
  - **변화:** `400 Bad Request` 에러가 사라지고 카카오 로그인 페이지로 정상적으로 이동하게 됨.

---

## 3. AI 자동작성 기능 500 에러

### 3.1. 문제 상황
- 상품 등록 페이지에서 "AI 자동작성" 버튼 클릭 시 `POST http://localhost/api/v1/ai/auto-listing` 요청에서 `500 Internal Server Error` 발생.

### 3.2. 해결 과정

#### 3.2.1. Caddy 라우팅 문제
- **원인 분석:** `handle_path /api/*` 규칙 때문에 AI 자동작성 요청이 모델 서버(`model`)가 아닌 백엔드(`backend`)로 잘못 전달되고 있었음.
- **해결:** 프론트엔드 `postApi.ts`에서 `autoWrite` 함수가 `/model/auto-listing`을 직접 호출하도록 수정하고, Caddy가 이 경로를 처리하도록 `Caddyfile` 수정. 최종적으로는 프론트엔드의 `api` 클라이언트(`baseURL: /api/v1`) 동작에 맞춰 `Caddyfile`에 `/api/v1/model/*` 경로를 `model` 서비스로 라우팅하는 규칙을 추가하여 해결.

#### 3.2.2. API 페이로드(Payload) 형식 불일치
- **원인 분석:** 라우팅 문제 해결 후, 모델 서버에서 `422 Unprocessable Entity` 에러 발생. 모델 서버는 `{"image_paths": [...]}` 형태의 JSON 객체를 기대했지만, 프론트엔드에서는 `[...]` 형태의 배열을 직접 보내고 있었음.
- **해결:** `postApi.ts`의 `autoWrite` 함수를 수정하여, `imagePaths` 배열을 `{"image_paths": imagePaths}` 객체로 감싸서 보내도록 수정.
  - **변화:** `422 Unprocessable Entity` 에러가 사라지고 AI 자동작성 기능이 정상 작동.

---

## 4. 기타 기능 수정

### 4.1. 조회수(viewCount) 미증가 및 0으로 표시되는 문제
- **원인 분석:**
    1. **호출 누락:** `ProductDetailPage.tsx`에서 조회수 증가 API(`incrementViewCount`)를 호출하는 로직이 누락되어 있었음.
    2. **프론트엔드 에러:** `incrementViewCount` 함수가 `productsApi`에 정의되어 있으나, `productApi`에서 호출하여 `is not a function` 타입 에러 발생.
- **해결:** `ProductDetailPage.tsx`의 `useEffect` 내에 `productsApi.incrementViewCount`를 호출하고, 반환 값을 기다린 후 프론트엔드 상태의 `viewCount`를 1 증가시키는 로직을 추가.

### 4.2. 마이페이지 채팅 개수 목업 데이터 문제
- **원인 분석:** `MyPage.tsx`의 "관심목록", "판매 중인 상품" 목록에서 `chatCount` 대신 `viewCount` 값을 사용하고 있었음. 실제 채팅 개수를 가져오는 `chatRoomsApi` 호출 로직이 누락.
- **해결:** 데이터 로딩 로직을 별도의 `myPageApi.ts` 파일로 분리하고, 이 서비스 내에서 `chatRoomsApi.getChatRoomCountsByProducts`를 호출하여 실제 채팅 개수를 가져와 매핑하도록 수정.
  - **변화:** 마이페이지 관련 목록에서 `viewCount` 대신 실제 `chatCount`가 표시됨.

### 4.3. 검색 기능 `Connection is read-only` 에러
- **원인 분석:** `ProductService` 클래스 전체에 `@Transactional(readOnly = true)`가 설정되어 있었음. 검색 기능(`searchProducts`)은 내부적으로 검색 로그를 저장(`INSERT`)하는 쓰기 작업을 포함하고 있는데, 이 메서드가 클래스 레벨의 읽기 전용 트랜잭션 설정을 상속받아 에러 발생.
- **해결:** `ProductService.searchProducts` 메서드에 `@Transactional` 어노테이션을 추가하여, 해당 메서드가 쓰기 가능한 트랜잭션으로 동작하도록 수정.
  - **변화:** `500 Internal Server Error` -> `200 OK`. 검색 기능이 정상 작동.

### 4.4. 시간 표시 형식 한글화
- **원인 분석:** `ProductService.getTimeAgo` 메서드가 "m ago", "h ago" 등 영어로 된 문자열을 하드코딩하여 반환하고 있었음.
- **해결:** 해당 메서드의 반환 값을 "분 전", "시간 전" 등 한글로 수정.
  - **변화:** API 응답의 `timeAgo` 필드가 한글로 변경됨.
