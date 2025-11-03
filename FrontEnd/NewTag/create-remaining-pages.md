# 나머지 페이지 생성 가이드

## 🚀 빠른 생성 방법

`Prototype.tsx.backup` 파일을 열고 다음 컴포넌트들을 복사하여 각 파일로 저장하세요:

### 1. CategoryListPage.tsx ✅ (생성 완료)
- 소스: `CategoryListScreen` (Line 442-474)
- 위치: `pages/home/CategoryListPage.tsx`

### 2. ProductDetailPage.tsx ⭐ (우선순위 높음)
- 소스: `DetailScreen` (Line 497-550)
- 위치: `pages/product/ProductDetailPage.tsx`
- import 추가:
```typescript
import React from 'react';
import { ChevronLeft, Heart, MapPin, Eye, MessageCircle } from 'lucide-react';
import type { Product, Screen } from '../../types';

interface ProductDetailPageProps {
  product: Product | null;
  setCurrentScreen: (screen: Screen) => void;
  likedProducts: number[];
  toggleLike: (id: number) => void;
  startChat: (product: any) => void;
}
```

### 3. ProductRegisterAIPage.tsx ⭐⭐⭐ (최우선 - 핵심 AI 기능!)
- 소스: `RegisterAIScreen` (Line 933-1165)
- 위치: `pages/product/ProductRegisterAIPage.tsx`
- **매우 중요:** Claude API 호출 코드 포함!

### 4. ChatPage.tsx ⭐
- 소스: `ChatScreen` (Line 737-836)
- 위치: `pages/chat/ChatPage.tsx`

### 5. ChatListPage.tsx
- 소스: `ChatListScreen` (Line 838-880)
- 위치: `pages/chat/ChatListPage.tsx`

### 6. MyPage.tsx
- 소스: `MyPageScreen` (Line 662-735)
- 위치: `pages/mypage/MyPage.tsx`

### 7. LikesPage.tsx
- 소스: `LikesScreen` (Line 598-628)
- 위치: `pages/mypage/LikesPage.tsx`

### 8. ExchangePage.tsx
- 소스: `ExchangeScreen` (Line 552-596)
- 위치: `pages/product/ExchangePage.tsx`

### 9. NotificationsPage.tsx
- 소스: `NotificationsScreen` (Line 630-660)
- 위치: `pages/mypage/NotificationsPage.tsx`

### 10. ReviewListPage.tsx
- 소스: `ReviewListScreen` + `ReviewCard` (Line 1167-1276)
- 위치: `pages/review/ReviewListPage.tsx`

### 11. ReviewWritePage.tsx
- 소스: `ReviewWriteScreen` (Line 1278-1410)
- 위치: `pages/review/ReviewWritePage.tsx`

### 12. ProductRegisterPage.tsx
- 소스: `RegisterScreen` (Line 882-931)
- 위치: `pages/product/ProductRegisterPage.tsx`

---

## 📋 생성 후 App.tsx 업데이트

모든 페이지를 생성한 후 `App.tsx`에 다음을 추가하세요:

```typescript
// Import 추가
import CategoryListPage from './pages/home/CategoryListPage';
import ProductDetailPage from './pages/product/ProductDetailPage';
import ProductRegisterAIPage from './pages/product/ProductRegisterAIPage';
import ProductRegisterPage from './pages/product/ProductRegisterPage';
import ExchangePage from './pages/product/ExchangePage';
import ChatPage from './pages/chat/ChatPage';
import ChatListPage from './pages/chat/ChatListPage';
import MyPage from './pages/mypage/MyPage';
import LikesPage from './pages/mypage/LikesPage';
import NotificationsPage from './pages/mypage/NotificationsPage';
import ReviewListPage from './pages/review/ReviewListPage';
import ReviewWritePage from './pages/review/ReviewWritePage';

// Return문에 추가
{currentScreen === 'category-list' && <CategoryListPage {...props} />}
{currentScreen === 'detail' && <ProductDetailPage {...props} />}
{currentScreen === 'register-ai' && <ProductRegisterAIPage {...props} />}
{currentScreen === 'register' && <ProductRegisterPage {...props} />}
{currentScreen === 'exchange' && <ExchangePage {...props} />}
{currentScreen === 'chat' && <ChatPage {...props} />}
{currentScreen === 'chatlist' && <ChatListPage {...props} />}
{currentScreen === 'mypage' && <MyPage {...props} />}
{currentScreen === 'likes' && <LikesPage {...props} />}
{currentScreen === 'notifications' && <NotificationsPage {...props} />}
{currentScreen === 'reviews' && <ReviewListPage {...props} />}
{currentScreen === 'review-write' && <ReviewWritePage {...props} />}
```

---

## ⚡ 자동 생성 대안

시간이 없다면 Prototype.tsx.backup을 그대로 사용하세요:
1. `App.tsx`에서 `import App from './Prototype.tsx.backup';` 변경
2. 이후 시간날 때 페이지별로 분리

현재 로그인/회원가입/홈 화면은 작동하므로,
나머지는 천천히 분리해도 됩니다!
