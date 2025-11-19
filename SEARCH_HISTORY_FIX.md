# 검색 기록 계정별 분리 수정

**날짜**: 2025-11-19
**문제**: 모든 계정에서 동일한 검색 기록이 표시됨
**해결**: Backend API 연동으로 사용자별 검색 기록 분리

---

## 🔍 문제 원인

### 변경 전 구조

```typescript
// Header.tsx - 기존 코드
import {
  getRecentSearches,      // ← localStorage에서 가져옴
  addRecentSearch,        // ← localStorage에 저장
  removeRecentSearch,
  clearRecentSearches
} from "../utils/localStorage";

// 컴포넌트 초기화
const [recentSearches, setRecentSearches] = useState<string[]>(
  getRecentSearches()  // ← 브라우저 localStorage
);

// 검색 시
addRecentSearch(query);  // ← localStorage에만 저장
```

**문제점**:
1. 검색어를 **브라우저의 localStorage**에만 저장
2. localStorage는 **브라우저별**로 저장됨 (사용자별 X)
3. 같은 브라우저를 사용하는 모든 계정이 같은 검색 기록을 공유
4. Backend API를 호출하지 않아 서버 DB에 저장되지 않음

---

## ✅ 해결 방법

### 변경 후 구조

```typescript
// Header.tsx - 수정된 코드
import { authApi } from "../api/auth";
import { productsApi } from "../api/products";

// Backend에서 로드
const [recentSearches, setRecentSearches] = useState<string[]>([]);

useEffect(() => {
  const checkAuthStatus = async () => {
    const isAuth = authApi.isAuthenticated();
    setIsLoggedIn(isAuth);

    // 로그인한 경우만 Backend에서 검색어 로드
    if (isAuth) {
      const currentUser = authApi.getCurrentUser();
      if (currentUser?.id) {
        const keywords = await productsApi.getRecentKeywords(
          currentUser.id,  // ← 사용자 ID로 조회
          10
        );
        setRecentSearches(keywords);
      }
    }
  };

  checkAuthStatus();
}, []);

// 검색 시 Backend API가 자동으로 호출됨
const handleSearchSubmit = async (query: string) => {
  if (onSearch) {
    onSearch(query);  // ← ProductService.searchProducts() 호출
                      //    → SearchLogService.logSearch() 호출
                      //    → DB에 저장
  }

  // 검색 후 최신 검색어 다시 로드
  const keywords = await productsApi.getRecentKeywords(userId, 10);
  setRecentSearches(keywords);
};
```

---

## 🔄 데이터 흐름

### 1️⃣ 검색어 저장 (검색 시)

```
┌─────────────────────────────────────────────┐
│ 1. 사용자가 검색창에 "아이폰" 입력          │
│    Header.tsx - handleSearchSubmit()        │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 2. 검색 페이지로 이동                        │
│    onSearch("아이폰") 호출                   │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 3. Backend API 호출                         │
│    GET /api/v1/products/search              │
│    params: { keyword: "아이폰",             │
│              userId: 1,                     │
│              deviceType: "PC" }             │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 4. ProductController.searchProducts()       │
│    → ProductService.searchProducts()        │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 5. SearchLogService.logSearch()             │
│    - User ID: 1                             │
│    - Keyword: "아이폰"                       │
│    - Result count: 15                       │
│    - Device type: PC                        │
│    → search_log 테이블에 INSERT             │
└─────────────────────────────────────────────┘
```

### 2️⃣ 검색어 조회 (Header 로드 시)

```
┌─────────────────────────────────────────────┐
│ 1. Header 컴포넌트 마운트                    │
│    useEffect() 실행                         │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 2. 현재 로그인 사용자 확인                   │
│    authApi.getCurrentUser()                 │
│    → userId: 1                              │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 3. Backend API 호출                         │
│    GET /api/v1/products/search/recent       │
│    params: { userId: 1, limit: 10 }        │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 4. ProductController.getRecentKeywords()    │
│    → SearchLogService.getRecentKeywords()   │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 5. SearchLogRepository 쿼리 실행            │
│    SELECT DISTINCT keyword                  │
│    FROM search_log                          │
│    WHERE user_id = 1                        │
│    ORDER BY created_at DESC                 │
│    LIMIT 10                                 │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 6. Frontend로 반환                          │
│    ["아이폰", "갤럭시", "맥북", ...]         │
│    → setRecentSearches() 업데이트           │
└─────────────────────────────────────────────┘
```

---

## 📊 DB 구조

### search_log 테이블

| Column | Type | 설명 |
|--------|------|------|
| id | BIGINT | PK |
| user_id | BIGINT | FK → user 테이블 (사용자별 구분!) |
| keyword | VARCHAR | 검색어 |
| result_count | INT | 검색 결과 개수 |
| device_type | ENUM | PC, MOBILE, TABLET, UNKNOWN |
| clicked_product_id | BIGINT | 클릭한 상품 (nullable) |
| clicked_at | DATETIME | 클릭 시간 (nullable) |
| created_at | DATETIME | 검색 시간 |

**핵심**: `user_id` 컬럼으로 **사용자별 검색 기록 분리**

---

## 🔧 수정 파일

### Frontend

#### 1. Header.tsx
**위치**: `FrontEnd/NewTag/src/components/Header.tsx`

**주요 변경사항**:
```diff
- import { getRecentSearches, addRecentSearch } from "../utils/localStorage";
+ import { authApi } from "../api/auth";
+ import { productsApi } from "../api/products";

- const [recentSearches, setRecentSearches] = useState<string[]>(getRecentSearches());
+ const [recentSearches, setRecentSearches] = useState<string[]>([]);

+ // Backend에서 검색어 로드
+ useEffect(() => {
+   const checkAuthStatus = async () => {
+     if (authApi.isAuthenticated()) {
+       const user = authApi.getCurrentUser();
+       if (user?.id) {
+         const keywords = await productsApi.getRecentKeywords(user.id, 10);
+         setRecentSearches(keywords);
+       }
+     }
+   };
+   checkAuthStatus();
+ }, []);

- const handleSearchSubmit = (query: string) => {
-   addRecentSearch(query);
-   setRecentSearches(getRecentSearches());
-   onSearch(query);
- };
+ const handleSearchSubmit = async (query: string) => {
+   if (onSearch) {
+     onSearch(query);  // Backend API 호출
+   }
+
+   // 검색 후 최신 검색어 다시 로드
+   const user = authApi.getCurrentUser();
+   if (user?.id) {
+     setTimeout(async () => {
+       const keywords = await productsApi.getRecentKeywords(user.id, 10);
+       setRecentSearches(keywords);
+     }, 500);
+   }
+ };
```

**제거된 기능**:
- localStorage 의존성 제거
- `removeRecentSearch()`, `clearRecentSearches()` 미사용 (Backend API 추가 필요)

---

## ✅ 테스트 가이드

### 1. 기본 동작 테스트

1. **계정 A로 로그인**
   ```bash
   - 로그인: user1@test.com
   - 검색: "아이폰", "갤럭시"
   - 검색 기록 확인: ["갤럭시", "아이폰"] 표시됨
   ```

2. **로그아웃 후 계정 B로 로그인**
   ```bash
   - 로그아웃
   - 로그인: user2@test.com
   - 검색 기록 확인: 비어있음 ✅
   - 검색: "맥북", "아이패드"
   - 검색 기록 확인: ["아이패드", "맥북"] 표시됨 ✅
   ```

3. **계정 A로 다시 로그인**
   ```bash
   - 로그아웃
   - 로그인: user1@test.com
   - 검색 기록 확인: ["갤럭시", "아이폰"] 그대로 유지됨 ✅
   ```

### 2. API 호출 확인

브라우저 개발자 도구 → Network 탭:

1. **Header 로드 시**:
   ```
   GET /api/v1/products/search/recent?userId=1&limit=10
   Response: ["갤럭시", "아이폰"]
   ```

2. **검색 시**:
   ```
   GET /api/v1/products/search?keyword=아이폰&userId=1&deviceType=PC
   Response: { products: [...], totalElements: 15 }
   ```

### 3. DB 확인

```sql
-- 사용자별 검색 기록 확인
SELECT
  u.nick AS 사용자,
  s.keyword AS 검색어,
  s.created_at AS 검색시간
FROM search_log s
JOIN user u ON s.user_id = u.id
ORDER BY s.created_at DESC
LIMIT 20;
```

**예상 결과**:
```
사용자    | 검색어   | 검색시간
---------|---------|-------------------
user1    | 갤럭시   | 2025-11-19 10:30:00
user1    | 아이폰   | 2025-11-19 10:29:00
user2    | 아이패드 | 2025-11-19 10:28:00
user2    | 맥북    | 2025-11-19 10:27:00
```

---

## ⚠️ 주의사항

### 1. 검색어 삭제 기능 미구현

**현재 상태**:
```typescript
// Header.tsx
const handleRemoveRecentSearch = async (query: string, e: React.MouseEvent) => {
  e.stopPropagation();
  // 임시로 로컬에서만 제거 (새로고침 시 다시 나타남)
  setRecentSearches(prev => prev.filter(q => q !== query));

  // TODO: Backend API 호출
  // await productsApi.deleteRecentKeyword(userId, query);
};
```

**필요한 작업**:
1. Backend에 검색어 삭제 API 추가
   ```java
   // SearchLogController.java
   @DeleteMapping("/search/recent/{keyword}")
   public ResponseEntity<Void> deleteRecentKeyword(
       @PathVariable String keyword,
       @RequestParam Long userId
   ) {
       searchLogService.deleteKeyword(userId, keyword);
       return ResponseEntity.ok().build();
   }
   ```

2. Frontend API 호출 구현
   ```typescript
   // products.ts
   deleteRecentKeyword: async (userId: number, keyword: string): Promise<void> => {
     await api.delete(`/products/search/recent/${keyword}`, {
       params: { userId }
     });
   }
   ```

### 2. 비로그인 사용자

**현재 동작**:
- 비로그인 시 검색 기록이 표시되지 않음
- 검색은 가능하지만 로그가 저장되지 않음 (userId가 없음)

**개선 방안**:
- 비로그인 사용자도 검색은 가능하되, 검색 기록은 표시하지 않음 (현재 구현)
- 또는 localStorage를 fallback으로 사용 (선택사항)

---

## 📈 성능 고려사항

### 1. API 호출 최적화

**현재**:
```typescript
// 검색 후 500ms 대기 후 재조회
setTimeout(async () => {
  const keywords = await productsApi.getRecentKeywords(userId, 10);
  setRecentSearches(keywords);
}, 500);
```

**개선 방안**:
- 검색 API에서 최신 검색어를 함께 반환
- WebSocket으로 실시간 동기화

### 2. 캐싱

**고려사항**:
- 검색어 목록을 React Query로 캐싱
- 5분 정도의 stale time 설정

---

## 🎯 결론

### ✅ 개선 완료

1. **사용자별 검색 기록 분리**
   - localStorage → Backend DB
   - user_id 기반 조회

2. **자동 동기화**
   - 검색 시 자동으로 Backend에 저장
   - Header 로드 시 Backend에서 조회

3. **계정 전환 지원**
   - 로그인/로그아웃 시 자동으로 검색 기록 갱신

### 📋 향후 개선 사항

1. 검색어 개별 삭제 API 구현
2. 검색어 전체 삭제 API 구현
3. API 호출 최적화 (React Query)
4. 비로그인 사용자 처리 개선

---

**작성**: Claude (AI Assistant)
**최종 업데이트**: 2025-11-19 10:30
