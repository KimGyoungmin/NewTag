# 🔐 NewTag 인증 시스템 문서

**작성일**: 2025-11-20
**최종 업데이트**: 2025-11-20

---

## 📋 개요

NewTag는 **JWT 기반 인증 시스템**을 사용합니다.
Firebase는 인증(Auth)이 아닌 **채팅 기능(Firestore)**에만 사용됩니다.

---

## 🏗️ 아키텍처

### 인증 방식
- **JWT (JSON Web Token)**: 모든 API 인증
- **Firebase Firestore**: 채팅 데이터 저장 (인증 무관)

### 토큰 저장 위치
- **LocalStorage**: 토큰 및 사용자 정보 지속성 보장
- **메모리 캐시**: 빠른 접근을 위한 캐싱

---

## 🔑 토큰 관리 (`tokenManager`)

### 저장되는 데이터

| 항목 | LocalStorage Key | 설명 |
|-----|------------------|-----|
| Access Token | `access_token` | API 요청 시 사용하는 JWT |
| Refresh Token | `refresh_token` | Access Token 갱신용 |
| 사용자 정보 | `current_user` | 현재 로그인한 사용자 정보 (JSON) |

### 주요 메서드

```typescript
// 토큰 조회
tokenManager.getAccessToken(): string | null
tokenManager.getRefreshToken(): string | null
tokenManager.getCurrentUser(): AuthUser | null

// 세션 설정 (로그인 시)
tokenManager.setSession(
  token: string | null,
  user?: AuthUser | null,
  refresh?: string | null
): void

// Access Token만 갱신 (Refresh 시)
tokenManager.setAccessToken(token: string): void

// 세션 초기화 (로그아웃 시)
tokenManager.clearSession(): void

// 인증 상태 변경 구독
tokenManager.subscribe(listener: () => void): () => void
```

---

## 🔄 인증 플로우

### 1. 로그인
```
User → LoginPage → authApi.login() → Backend /api/v1/login
  ↓
Backend returns: { success: true, token, user }
  ↓
tokenManager.setSession(token, user)
  ↓
LocalStorage 저장 + 메모리 캐싱
  ↓
'auth-change' 이벤트 발생 → App 컴포넌트 리렌더링
```

### 2. 초기화 (새로고침/앱 시작)
```
App Mount → authApi.initialize()
  ↓
tokenManager.getAccessToken() (LocalStorage에서 자동 로드)
  ↓
있으면: Backend /api/v1/auth/refresh 호출
  ↓
성공: tokenManager.setSession(new_token, user)
실패: tokenManager.clearSession() → 로그인 페이지
```

### 3. API 요청 (자동 토큰 첨부)
```
API 요청 → axios interceptor
  ↓
headers.Authorization = `Bearer ${accessToken}`
  ↓
Backend API 처리
```

### 4. 토큰 갱신 (401 에러 시 자동)
```
API 요청 → 401 Unauthorized
  ↓
axios interceptor 감지
  ↓
refreshAccessToken() 호출 (한 번만 실행되도록 Promise 캐싱)
  ↓
Backend /api/v1/auth/refresh
  ↓
성공: tokenManager.setAccessToken(new_token)
      원래 요청 재시도
실패: tokenManager.clearSession() → 로그인 페이지
```

### 5. 로그아웃
```
User → 로그아웃 버튼 클릭
  ↓
authApi.logout()
  ↓
Backend /api/v1/logout
  ↓
tokenManager.clearSession()
  ↓
LocalStorage 전체 삭제
  ↓
'auth-change' 이벤트 발생 → 로그인 페이지로 이동
```

---

## 🛡️ 보안 기능

### 1. **자동 토큰 갱신**
- Access Token 만료 시 자동으로 Refresh
- 사용자 경험 중단 없음
- 중복 갱신 방지 (Promise 캐싱)

### 2. **401 에러 처리**
- 모든 API 요청에서 자동 처리
- 갱신 실패 시 자동 로그아웃

### 3. **토큰 지속성**
- LocalStorage에 저장하여 새로고침 시에도 로그인 유지
- 브라우저 종료 후 재시작 시에도 세션 유지

### 4. **인증 가드**
- React Router의 보호된 라우트
- 미인증 시 자동 로그인 페이지 리다이렉트

---

## 📁 파일 구조

```
FrontEnd/NewTag/src/
├── api/
│   ├── auth.ts              # 인증 API (login, signup, logout)
│   ├── tokenManager.ts      # 토큰 관리 (LocalStorage + 메모리)
│   ├── client.ts            # axios 클라이언트 (인터셉터)
│   └── firebase.ts          # Firebase Firestore (채팅용)
├── pages/
│   ├── LoginPage.tsx        # 로그인 페이지
│   └── SignupPage.tsx       # 회원가입 페이지
└── App.tsx                  # 인증 가드 및 라우팅
```

---

## 🔧 설정

### Axios Interceptor

**Request Interceptor** (모든 요청에 토큰 자동 첨부):
```typescript
apiClient.interceptors.request.use((config) => {
  const token = tokenManager.getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**Response Interceptor** (401 에러 시 자동 갱신):
```typescript
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(error.config);
      }
    }
    return Promise.reject(error);
  }
);
```

---

## 🚀 사용 예시

### 로그인
```typescript
import { authApi } from './api/auth';

const handleLogin = async () => {
  try {
    const response = await authApi.login({ email, password });
    if (response.success) {
      // 자동으로 토큰 저장 및 로그인 처리됨
      navigate('/');
    }
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

### 로그아웃
```typescript
import { authApi } from './api/auth';

const handleLogout = async () => {
  await authApi.logout();
  // 자동으로 토큰 삭제 및 로그인 페이지로 이동됨
};
```

### 현재 사용자 정보 조회
```typescript
import { authApi } from './api/auth';

const currentUser = authApi.getCurrentUser();
if (currentUser) {
  console.log(currentUser.nick, currentUser.email);
}
```

### 인증 상태 확인
```typescript
import { authApi } from './api/auth';

const isLoggedIn = authApi.isAuthenticated();
```

---

## ⚠️ 주의사항

### 1. Firebase Auth는 사용하지 않음
- Firebase는 **Firestore(채팅)**에만 사용
- 인증은 100% JWT 기반

### 2. LocalStorage 보안
- XSS 공격에 취약할 수 있음
- HTTPS 사용 필수
- Content Security Policy 적용 권장

### 3. Refresh Token
- 현재 쿠키 기반으로 백엔드에서 관리
- HttpOnly 쿠키로 보안 강화 권장

---

## 🔍 디버깅

### LocalStorage 확인
```javascript
// 브라우저 콘솔에서
localStorage.getItem('access_token')
localStorage.getItem('refresh_token')
localStorage.getItem('current_user')
```

### 토큰 만료 테스트
```javascript
// 의도적으로 잘못된 토큰 설정
tokenManager.setAccessToken('invalid_token');
// 다음 API 요청 시 자동 갱신 동작 확인
```

### 로그 확인
- `[tokenManager]`: 토큰 저장/로드 관련 로그
- `[API]`: API 요청 및 토큰 갱신 로그

---

## 📊 개선 사항 (2025-11-20)

### 완료된 개선
- ✅ LocalStorage 지속성 추가 (새로고침 시 로그인 유지)
- ✅ 토큰 갱신 로직 개선
- ✅ setAccessToken 메서드 추가 (조용한 갱신)
- ✅ 초기화 시 자동 로드

### 향후 개선 계획
- [ ] Refresh Token 만료 처리
- [ ] 토큰 만료 시간 표시
- [ ] Remember Me 기능
- [ ] 다중 디바이스 로그인 관리

---

## 📚 관련 문서

- [Backend API 문서](../../BackEnd/README.md)
- [React Router 가이드](./ROUTER.md)
- [TODO_LIST.md](../../TODO_LIST.md)

---

**작성자**: Claude Code AI Assistant
