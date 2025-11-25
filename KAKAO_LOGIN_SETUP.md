# 카카오 로그인 설정 가이드

카카오 로그인 기능이 성공적으로 구현되었습니다! 이제 설정만 완료하면 바로 사용할 수 있습니다.

## 📋 구현 완료 항목

### 백엔드 (Spring Boot)
- ✅ `KakaoAuthService`: 카카오 OAuth 토큰 교환 및 사용자 정보 처리
- ✅ `KakaoUserInfo` DTO: 카카오 API 응답 매핑
- ✅ `UserController`: `/api/v1/auth/kakao/callback` 엔드포인트 추가
- ✅ `UserRepository`: 소셜 로그인 사용자 조회 메서드 추가
- ✅ `SecurityConfig`: 카카오 콜백 URL 공개 설정
- ✅ 자동 회원가입: 첫 로그인 시 User 테이블에 자동 생성

### 프론트엔드 (React + TypeScript)
- ✅ 카카오 JavaScript SDK 로드 (index.html)
- ✅ `authApi.loginWithKakao()`: 카카오 인증 페이지로 리다이렉트
- ✅ `authApi.handleKakaoCallback()`: 인증 코드를 백엔드로 전송
- ✅ `KakaoCallbackPage`: 카카오 로그인 콜백 처리 페이지
- ✅ `LoginPage`: 카카오 로그인 버튼 연동
- ✅ 라우팅 설정: `/auth/kakao/callback` 경로 추가

---

## 🔧 설정 방법

### 1. 카카오 개발자 센터에서 애플리케이션 등록

1. [카카오 개발자 센터](https://developers.kakao.com/) 접속
2. 로그인 후 **내 애플리케이션** → **애플리케이션 추가하기**
3. 앱 이름, 사업자명 입력 후 저장

### 2. REST API 키 발급

1. 생성한 애플리케이션 선택
2. **앱 키** 섹션에서 **REST API 키** 확인
3. 이 키를 복사해둡니다

### 3. 리다이렉트 URI 설정

1. 좌측 메뉴에서 **플랫폼** 선택
2. **Web 플랫폼 등록** 클릭
3. 사이트 도메인 입력:
   - 개발: `http://localhost:5173`
   - 프로덕션: 실제 도메인 (예: `https://yourdomain.com`)

4. 좌측 메뉴에서 **카카오 로그인** 선택
5. **Redirect URI** 등록:
   - 개발: `http://localhost:5173/auth/kakao/callback`
   - 프로덕션: `https://yourdomain.com/auth/kakao/callback`

6. **활성화 설정** → **카카오 로그인 활성화** ON

### 4. 동의 항목 설정

1. 좌측 메뉴에서 **동의항목** 선택
2. 다음 항목들을 설정:
   - **닉네임**: 필수 동의
   - **프로필 사진**: 선택 동의
   - **카카오계정(이메일)**: 선택 동의

### 5. 환경 변수 설정

#### 백엔드 (.env)
`BackEnd/.env` 파일을 열고 다음과 같이 설정:

```env
# Kakao OAuth
KAKAO_CLIENT_ID=your_kakao_rest_api_key_here  # 2단계에서 복사한 REST API 키
KAKAO_CLIENT_SECRET=  # 카카오는 보통 비워둡니다
```

**실제 예시:**
```env
KAKAO_CLIENT_ID=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
KAKAO_CLIENT_SECRET=
```

#### 프론트엔드 (.env)
`FrontEnd/NewTag/.env` 파일을 열고 다음을 확인:

```env
# Kakao Map API (로그인에도 사용됨)
VITE_KAKAO_MAP_APP_KEY=94acb8472715fc98da54147ab20e488c
```

> **참고:** 프론트엔드는 기존의 카카오 맵 JavaScript 키를 그대로 사용합니다.

---

## 🚀 실행 방법

### 1. 백엔드 실행
```bash
cd BackEnd
mvn spring-boot:run
```

서버가 `http://localhost:8081`에서 실행됩니다.

### 2. 프론트엔드 실행
```bash
cd FrontEnd/NewTag
npm run dev
```

프론트엔드가 `http://localhost:5173`에서 실행됩니다.

### 3. 로그인 테스트

1. 브라우저에서 `http://localhost:5173/login` 접속
2. **카카오로 계속하기** 버튼 클릭
3. 카카오 계정으로 로그인
4. 동의 후 자동으로 홈 화면으로 이동

---

## 🔍 로그인 플로우

```
사용자
  ↓ (1) 카카오 버튼 클릭
프론트엔드 (authApi.loginWithKakao)
  ↓ (2) 카카오 인증 페이지로 리다이렉트
카카오 로그인 페이지
  ↓ (3) 사용자 로그인 및 동의
프론트엔드 (/auth/kakao/callback?code=xxx)
  ↓ (4) 인증 코드를 백엔드로 전송
백엔드 (KakaoAuthService)
  ↓ (5) 카카오 API로 토큰 교환
  ↓ (6) 사용자 정보 조회
  ↓ (7) 기존 회원 확인 또는 신규 회원 가입
  ↓ (8) JWT 토큰 발급
프론트엔드
  ↓ (9) JWT 저장 및 홈으로 이동
완료!
```

---

## 📝 데이터베이스 스키마

카카오 로그인 시 User 테이블에 다음과 같이 저장됩니다:

| 컬럼 | 값 | 설명 |
|------|-----|------|
| `provider` | `KAKAO` | 소셜 로그인 제공자 |
| `provider_id` | 카카오 고유 ID | 카카오에서 발급한 사용자 ID |
| `nick` | 카카오 닉네임 | 중복 시 숫자 추가 (예: 홍길동1) |
| `email` | 카카오 이메일 | 제공하지 않으면 임시 이메일 생성 |
| `name` | 카카오 닉네임 | |
| `profile_img` | 프로필 이미지 URL | 없으면 `default_img.png` |
| `password` | (빈 값) | 소셜 로그인은 비밀번호 불필요 |
| `role` | `USER` | 기본 사용자 권한 |
| `trust` | `50.0` | 기본 신뢰도 점수 |

---

## 🛠️ 트러블슈팅

### 문제: "카카오 JavaScript 키가 설정되지 않았습니다"
**해결:** `FrontEnd/NewTag/.env` 파일에서 `VITE_KAKAO_MAP_APP_KEY`가 올바르게 설정되었는지 확인하세요.

### 문제: "redirect_uri mismatch" 오류
**해결:**
1. 카카오 개발자 센터에서 등록한 Redirect URI가 정확한지 확인
2. `http://localhost:5173/auth/kakao/callback`이 정확히 등록되어 있는지 확인
3. 프로토콜(http/https), 포트 번호가 일치하는지 확인

### 문제: "카카오 액세스 토큰을 받아오지 못했습니다"
**해결:**
1. 백엔드 `.env` 파일의 `KAKAO_CLIENT_ID`가 정확한지 확인
2. 카카오 개발자 센터에서 앱이 활성화 상태인지 확인
3. 백엔드 로그를 확인하여 자세한 오류 메시지 확인

### 문제: 이메일 정보를 받아올 수 없음
**해결:**
1. 카카오 개발자 센터 → 동의항목 → 카카오계정(이메일) 설정 확인
2. 사용자가 로그인 시 이메일 제공에 동의했는지 확인
3. 이메일이 없어도 로그인은 가능하며, 임시 이메일이 생성됩니다

---

## 📚 추가 기능 확장 아이디어

1. **네이버 로그인**: 같은 방식으로 네이버 OAuth 구현
2. **구글 로그인**: Google OAuth 2.0 연동
3. **프로필 연동**: 소셜 계정 프로필과 앱 프로필 동기화
4. **계정 연결**: 기존 계정에 소셜 계정 추가 연결
5. **로그아웃 개선**: 카카오 로그아웃 API 호출

---

## ✅ 체크리스트

설정이 완료되었는지 확인하세요:

- [ ] 카카오 개발자 센터에서 앱 생성
- [ ] REST API 키 발급
- [ ] Redirect URI 등록 (`http://localhost:5173/auth/kakao/callback`)
- [ ] 카카오 로그인 활성화
- [ ] 동의 항목 설정 (닉네임, 이메일)
- [ ] 백엔드 `.env`에 `KAKAO_CLIENT_ID` 설정
- [ ] 프론트엔드 `.env`에 `VITE_KAKAO_MAP_APP_KEY` 확인
- [ ] 백엔드 실행 (`mvn spring-boot:run`)
- [ ] 프론트엔드 실행 (`npm run dev`)
- [ ] 로그인 테스트

---

## 🎉 완료!

모든 설정이 완료되었습니다. 이제 카카오 로그인 기능을 사용할 수 있습니다!

문제가 발생하면 위의 트러블슈팅 섹션을 참고하거나, 백엔드 및 브라우저 콘솔의 로그를 확인하세요.
