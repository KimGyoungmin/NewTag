# 인증 시스템 통합 분석 및 개선 방안

**작성일**: 2025-11-19
**상태**: 분석 완료

---

## 📊 현재 인증 시스템 현황

### 🔍 발견 사항

현재 프로젝트는 **JWT 단일 인증 시스템**을 사용하고 있으며, Firebase는 **채팅 기능에만** 사용됩니다.

#### ✅ 좋은 점
- **역할이 명확하게 분리됨**
  - JWT: 사용자 인증 및 API 인증
  - Firebase: 채팅 데이터 저장소 (Firestore만 사용)
- **Firebase Authentication을 사용하지 않음** (혼란 없음)
- **JWT 기반 통일된 인증 흐름**

---

## 🔐 현재 인증 흐름 상세 분석

### 1. Frontend 인증 구조

#### **tokenManager.ts** - 토큰 관리
```typescript
let accessToken: string | null = null;
let currentUser: AuthUser | null = null;

export const tokenManager = {
  getAccessToken: () => accessToken,
  getCurrentUser: () => currentUser,
  setSession: (token: string | null, user?: AuthUser | null) => {
    accessToken = token;
    currentUser = user;
    notify(); // 'auth-change' 이벤트 발생
  },
  clearSession: () => {
    accessToken = null;
    currentUser = null;
    notify();
  },
};
```

**특징:**
- ✅ 메모리에만 토큰 저장 (보안상 안전)
- ❌ 새로고침 시 토큰 유실 → `/auth/refresh` API 필요

---

#### **authApi.ts** - 인증 API

**주요 기능:**
1. **로그인** (`/login`)
   ```typescript
   login: async (credentials: LoginRequest) => {
     const response = await api.post('/login', credentials);
     tokenManager.setSession(response.data.token, response.data.user);
     return response.data;
   }
   ```

2. **토큰 갱신** (`/auth/refresh`)
   ```typescript
   initialize: async () => {
     const response = await api.post('/auth/refresh');
     if (response.data.success && response.data.token) {
       tokenManager.setSession(response.data.token, response.data.user);
       return response.data.user;
     }
     tokenManager.clearSession();
     return null;
   }
   ```

3. **로그아웃** (`/logout`)
   ```typescript
   logout: async () => {
     await api.post('/logout');
     tokenManager.clearSession();
   }
   ```

---

#### **client.ts** - API 클라이언트 (Axios)

**토큰 자동 주입:**
```typescript
api.interceptors.request.use((config) => {
  const token = tokenManager.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**401 에러 처리:**
```typescript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      tokenManager.clearSession();
      // 로그인 페이지로 리다이렉트 (필요 시)
    }
    return Promise.reject(error);
  }
);
```

---

### 2. Backend 인증 구조 (추정)

**현재 구현 상태:**
- ✅ Spring Security + JWT 사용 (pom.xml에 `jjwt` 의존성 확인)
- ✅ OAuth2 클라이언트 설정 (소셜 로그인 준비)
- ⚠️ Security Config 파일 미발견 (추가 분석 필요)

**예상 엔드포인트:**
| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/login` | POST | 로그인 (JWT 발급) |
| `/signup` | POST | 회원가입 |
| `/logout` | POST | 로그아웃 |
| `/auth/refresh` | POST | 토큰 갱신 |
| `/emailMatch` | GET | 이메일 중복 확인 |
| `/idMatch` | GET | 닉네임 중복 확인 |

---

### 3. Firebase 사용 현황

**Firebase는 인증에 사용되지 않음!**

#### **실제 사용처: 채팅 기능**
- **Firestore** (문서 데이터베이스)
  - `chatRooms` 컬렉션: 채팅방 정보
  - `messages` 컬렉션: 채팅 메시지
  - 실시간 메시지 동기화 (`onSnapshot`)

```typescript
// firebase.ts
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  // ... (Firebase Authentication은 사용하지 않음)
};
```

---

## ❌ 현재 시스템의 문제점

### 1. **토큰 영속성 문제**

**문제:**
- 토큰을 메모리에만 저장
- 새로고침 시 토큰 유실
- 매번 `/auth/refresh` API 호출 필요

**해결 방안:**
```typescript
// tokenManager.ts 개선
export const tokenManager = {
  setSession: (token: string | null, user?: AuthUser | null) => {
    accessToken = token;
    currentUser = user;

    // LocalStorage에도 저장 (XSS 위험 있음, 대안: httpOnly Cookie)
    if (token) {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('current_user');
    }

    notify();
  },

  // 초기화 시 LocalStorage에서 복원
  initialize: () => {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('current_user');

    if (token && user) {
      accessToken = token;
      currentUser = JSON.parse(user);
    }
  },
};
```

---

### 2. **토큰 자동 갱신 미구현**

**문제:**
- JWT 만료 시 자동 갱신 없음
- 사용자가 갑자기 로그아웃될 수 있음

**해결 방안:**
```typescript
// client.ts
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 에러 && 토큰 갱신 시도하지 않은 요청
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // 토큰 갱신 시도
        const response = await api.post('/auth/refresh');
        const newToken = response.data.token;

        tokenManager.setSession(newToken, response.data.user);

        // 원래 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // 갱신 실패 → 로그아웃
        tokenManager.clearSession();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

---

### 3. **Backend 토큰 관리 (추정)**

**필요한 Backend 구현:**

#### **Refresh Token 패턴**
```java
@RestController
@RequestMapping("/auth")
public class AuthController {

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refreshToken(
        @CookieValue(name = "refresh_token", required = false) String refreshToken
    ) {
        if (refreshToken == null || !jwtService.validateRefreshToken(refreshToken)) {
            return ResponseEntity.status(401).build();
        }

        String userId = jwtService.getUserIdFromRefreshToken(refreshToken);
        User user = userService.findById(userId);

        // 새로운 Access Token 발급
        String newAccessToken = jwtService.generateAccessToken(user);

        return ResponseEntity.ok(LoginResponse.builder()
            .success(true)
            .token(newAccessToken)
            .user(UserDto.from(user))
            .build());
    }
}
```

#### **JWT 구조**
```java
public class JwtService {

    // Access Token: 15분 유효
    public String generateAccessToken(User user) {
        return Jwts.builder()
            .setSubject(user.getId().toString())
            .claim("nick", user.getNick())
            .claim("email", user.getEmail())
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + 15 * 60 * 1000))
            .signWith(SignatureAlgorithm.HS512, secretKey)
            .compact();
    }

    // Refresh Token: 7일 유효 (httpOnly Cookie로 저장)
    public String generateRefreshToken(User user) {
        return Jwts.builder()
            .setSubject(user.getId().toString())
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + 7 * 24 * 60 * 60 * 1000))
            .signWith(SignatureAlgorithm.HS512, refreshSecretKey)
            .compact();
    }
}
```

---

## 🎯 권장 인증 흐름

### **최종 권장 아키텍처**

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │ tokenManager │ ◄────── │   authApi    │                 │
│  │              │         │              │                 │
│  │ - accessToken│         │ - login()    │                 │
│  │ - user       │         │ - logout()   │                 │
│  │              │         │ - refresh()  │                 │
│  └──────┬───────┘         └──────┬───────┘                 │
│         │                        │                          │
│         │                        │                          │
│         ▼                        ▼                          │
│  ┌────────────────────────────────────┐                    │
│  │         Axios Client                │                    │
│  │ - Authorization 헤더 자동 주입      │                    │
│  │ - 401 에러 시 토큰 자동 갱신        │                    │
│  └────────────────┬───────────────────┘                    │
│                   │                                         │
└───────────────────┼─────────────────────────────────────────┘
                    │
                    │ HTTP (Bearer Token)
                    │
┌───────────────────▼─────────────────────────────────────────┐
│                      Backend (Spring Boot)                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │ AuthController│────────►│  JwtService  │                 │
│  │              │         │              │                 │
│  │ - /login     │         │ - generate() │                 │
│  │ - /logout    │         │ - validate() │                 │
│  │ - /refresh   │         │              │                 │
│  └──────────────┘         └──────────────┘                 │
│                                   │                         │
│                                   │                         │
│  ┌─────────────────────────────────┐                       │
│  │     Spring Security Filter      │                       │
│  │ - JWT 검증                       │                       │
│  │ - 권한 체크                       │                       │
│  └─────────────────────────────────┘                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Firebase Firestore                        │
│                   (채팅 데이터만 저장)                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │  chatRooms   │         │   messages   │                 │
│  │  컬렉션        │         │   컬렉션      │                 │
│  └──────────────┘         └──────────────┘                 │
│                                                              │
│  * JWT 토큰으로 인증된 사용자만 접근                           │
│  * Firebase Auth 사용 안 함                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ 개선 작업 체크리스트

### Phase 1: Frontend 개선 (2-3시간)
- [ ] tokenManager에 LocalStorage 추가
- [ ] Axios Interceptor에 자동 토큰 갱신 추가
- [ ] 로그인 유지 체크박스 UI 추가 (선택사항)

### Phase 2: Backend 개선 (4-6시간)
- [ ] Refresh Token 발급 로직 추가
- [ ] `/auth/refresh` 엔드포인트 구현
- [ ] httpOnly Cookie로 Refresh Token 저장
- [ ] Security Config 확인 및 개선

### Phase 3: 보안 강화 (2-3시간)
- [ ] XSS 방어 (CSP 헤더)
- [ ] CSRF 방어 (SameSite Cookie)
- [ ] Rate Limiting (로그인 시도 제한)

---

## 📝 결론

### 현재 상태: ✅ 양호
- JWT 단일 인증 시스템으로 통일
- Firebase는 채팅 전용 (역할 명확)
- 큰 구조적 문제 없음

### 개선 필요 사항: ⚠️ 중간
1. **토큰 영속성** (새로고침 문제)
2. **자동 토큰 갱신** (사용자 경험)
3. **Refresh Token 패턴** (보안 강화)

### 우선순위:
1. 🔴 **긴급**: 토큰 자동 갱신 (UX)
2. 🟡 **중요**: LocalStorage 또는 httpOnly Cookie 저장
3. 🟢 **개선**: Refresh Token 패턴 도입

---

**다음 단계**: 위 개선 작업을 단계별로 진행할까요?

**작성자**: Claude Code AI Assistant
**문의**: 추가 분석이 필요하면 말씀해주세요
