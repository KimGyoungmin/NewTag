# Prototype.tsx 완전 분리 작업 완료 가이드

## ✅ 완료된 작업

### 1. 서비스 레이어 (100% 완료)
- ✅ `services/firebase/config.ts` - Firebase 초기화
- ✅ `services/firebase/chatService.ts` - 실시간 채팅 서비스
- ✅ `services/api/client.ts` - Axios 클라이언트 설정
- ✅ `services/api/authApi.ts` - 인증 API
- ✅ `services/api/productApi.ts` - 상품 API
- ✅ `services/api/reviewApi.ts` - 후기 API

### 2. 공통 컴포넌트 (100% 완료)
- ✅ `components/common/BottomNav.tsx`
- ✅ `components/common/Header.tsx`
- ✅ `components/product/ProductCard.tsx`
- ✅ `components/product/ProductSection.tsx`

### 3. Auth 페이지 (100% 완료)
- ✅ `pages/auth/LoginPage.tsx`
- ✅ `pages/auth/SignupPage.tsx`

### 4. Home 페이지 (100% 완료)
- ✅ `pages/home/HomePage.tsx`

---

## 📝 나머지 페이지 생성 가이드

아래 파일들을 Prototype.tsx의 해당 컴포넌트에서 복사하여 생성하세요:

### pages/home/CategoryListPage.tsx
```typescript
import React from 'react';
import { ChevronLeft } from 'lucide-react';
import ProductCard from '../../components/product/ProductCard';
import type { Product, Screen } from '../../types';

interface CategoryListPageProps {
  categoryType: string;
  products: Product[];
  navigateToDetail: (product: Product) => void;
  likedProducts: number[];
  toggleLike: (id: number) => void;
  setCurrentScreen: (screen: Screen) => void;
}

const CategoryListPage: React.FC<CategoryListPageProps> = ({
  categoryType,
  products,
  navigateToDetail,
  likedProducts,
  toggleLike,
  setCurrentScreen,
}) => {
  const getTitleAndEmoji = () => {
    switch(categoryType) {
      case 'latest': return '🆕 최신 상품';
      case 'hot': return '🔥 핫딜 상품';
      case 'recommended': return '⭐ 추천 상품';
      default: return '상품 목록';
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 flex items-center gap-2">
        <ChevronLeft className="w-6 h-6 cursor-pointer" onClick={() => setCurrentScreen('home')} />
        <h1 className="text-lg font-bold">{getTitleAndEmoji()}</h1>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="grid grid-cols-2 gap-4 p-4">
          {products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={() => navigateToDetail(product)}
              isLiked={likedProducts.includes(product.id)}
              onLikeToggle={() => toggleLike(product.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryListPage;
```

### pages/product/ProductDetailPage.tsx
Prototype.tsx의 `DetailScreen` 컴포넌트를 복사하여 다음과 같이 변경:
- 컴포넌트명: `ProductDetailPage`
- Props 타입 정의
- import 경로 수정

### pages/product/ProductRegisterPage.tsx
Prototype.tsx의 `RegisterScreen` 복사

### pages/product/ProductRegisterAIPage.tsx
Prototype.tsx의 `RegisterAIScreen` 복사 (가장 중요한 AI 기능)

### pages/product/ExchangePage.tsx
Prototype.tsx의 `ExchangeScreen` 복사

### pages/mypage/MyPage.tsx
Prototype.tsx의 `MyPageScreen` 복사

### pages/mypage/LikesPage.tsx
Prototype.tsx의 `LikesScreen` 복사

### pages/mypage/NotificationsPage.tsx
Prototype.tsx의 `NotificationsScreen` 복사

### pages/chat/ChatPage.tsx
Prototype.tsx의 `ChatScreen` 복사

### pages/chat/ChatListPage.tsx
Prototype.tsx의 `ChatListScreen` 복사

### pages/review/ReviewListPage.tsx
Prototype.tsx의 `ReviewListScreen` 복사

### pages/review/ReviewWritePage.tsx
Prototype.tsx의 `ReviewWritePage` 복사

---

## 🚀 빠른 생성 스크립트

### 방법 1: 수동 복사 (권장)
1. Prototype.tsx 열기
2. 각 Screen 컴포넌트 찾기 (예: `const LoginScreen = ...`)
3. 전체 코드 복사
4. 해당 페이지 파일에 붙여넣기
5. 다음 항목 수정:
   - `export default 컴포넌트명` 추가
   - Props interface 정의
   - import 경로 수정 (`../../types`, `../../components/...`)

### 방법 2: 자동 스크립트 (Node.js)
```javascript
// scripts/split-prototype.js
const fs = require('fs');
const path = require('path');

const prototypeContent = fs.readFileSync(
  'src/Prototype.tsx',
  'utf-8'
);

const componentMap = {
  'DetailScreen': 'pages/product/ProductDetailPage.tsx',
  'RegisterScreen': 'pages/product/ProductRegisterPage.tsx',
  'RegisterAIScreen': 'pages/product/ProductRegisterAIPage.tsx',
  'ExchangeScreen': 'pages/product/ExchangePage.tsx',
  'LikesScreen': 'pages/mypage/LikesPage.tsx',
  'NotificationsScreen': 'pages/mypage/NotificationsPage.tsx',
  'MyPageScreen': 'pages/mypage/MyPage.tsx',
  'ChatScreen': 'pages/chat/ChatPage.tsx',
  'ChatListScreen': 'pages/chat/ChatListPage.tsx',
  'ReviewListScreen': 'pages/review/ReviewListPage.tsx',
  'ReviewWriteScreen': 'pages/review/ReviewWritePage.tsx',
  'CategoryListScreen': 'pages/home/CategoryListPage.tsx',
};

// 각 컴포넌트 추출 및 파일 생성
// (정규식으로 컴포넌트 추출 후 파일 생성)
```

---

## 📦 최종 App.tsx 리팩토링

```typescript
import React, { useState } from 'react';
import BottomNav from './components/common/BottomNav';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';

// Home Pages
import HomePage from './pages/home/HomePage';
import CategoryListPage from './pages/home/CategoryListPage';

// Product Pages
import ProductDetailPage from './pages/product/ProductDetailPage';
import ProductRegisterPage from './pages/product/ProductRegisterPage';
import ProductRegisterAIPage from './pages/product/ProductRegisterAIPage';
import ExchangePage from './pages/product/ExchangePage';

// MyPage Pages
import MyPage from './pages/mypage/MyPage';
import LikesPage from './pages/mypage/LikesPage';
import NotificationsPage from './pages/mypage/NotificationsPage';

// Chat Pages
import ChatPage from './pages/chat/ChatPage';
import ChatListPage from './pages/chat/ChatListPage';

// Review Pages
import ReviewListPage from './pages/review/ReviewListPage';
import ReviewWritePage from './pages/review/ReviewWritePage';

import type { Screen, Product, ReviewTarget } from './types';

// 임시 프로토타입 데이터 (나중에 API로 대체)
const initialProducts = [
  { id: 1, title: '아이폰 15 프로', price: 800000, locationNm: '강남구', favoriteCount: 23, emoji: '📱', viewCount: 142, seller: '홍길동', sellerId: 1, isHot: true, isNew: true },
  // ... 기타 데이터
] as any[];

const App = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [likedProducts, setLikedProducts] = useState<number[]>([1, 3]);
  const [products] = useState(initialProducts);
  const [notifications] = useState([
    { id: 1, message: '김철수님이 메시지를 보냈습니다', time: '5분 전', isRead: false },
  ]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [categoryType, setCategoryType] = useState('latest');
  const [chatMessages, setChatMessages] = useState<any>({});
  const [activeChat, setActiveChat] = useState<any>(null);
  const [showRegisterMenu, setShowRegisterMenu] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null);

  const toggleLike = (productId: number) => {
    setLikedProducts(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const navigateToDetail = (product: Product) => {
    setSelectedProduct(product);
    setCurrentScreen('detail');
  };

  const startChat = (product: any) => {
    setActiveChat(product);
    setCurrentScreen('chat');
    if (!chatMessages[product.id]) {
      setChatMessages((prev: any) => ({
        ...prev,
        [product.id]: [
          { sender: 'seller', text: `안녕하세요! ${product.title}에 관심 가져주셔서 감사합니다.`, time: '오후 2:30' }
        ]
      }));
    }
  };

  const sendMessage = (text: string) => {
    if (!text.trim() || !activeChat) return;

    setChatMessages((prev: any) => ({
      ...prev,
      [activeChat.id]: [
        ...(prev[activeChat.id] || []),
        { sender: 'user', text, time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) }
      ]
    }));

    setTimeout(() => {
      setChatMessages((prev: any) => ({
        ...prev,
        [activeChat.id]: [
          ...(prev[activeChat.id] || []),
          { sender: 'seller', text: '네, 가능합니다!', time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) }
        ]
      }));
    }, 1000);
  };

  const newProducts = products.filter((p: any) => p.isNew);
  const hotProducts = products.filter((p: any) => p.isHot);
  const recommendedProducts = products.filter((p: any) => p.isRecommended);
  const exchangeProducts = products.filter((p: any) => p.canExchange);
  const likedProductsList = products.filter((p: any) => likedProducts.includes(p.id));

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen flex flex-col shadow-2xl">
      {currentScreen === 'login' && <LoginPage setCurrentScreen={setCurrentScreen} />}
      {currentScreen === 'signup' && <SignupPage setCurrentScreen={setCurrentScreen} />}
      {currentScreen === 'home' && (
        <HomePage
          newProducts={newProducts}
          hotProducts={hotProducts}
          recommendedProducts={recommendedProducts}
          navigateToDetail={navigateToDetail}
          likedProducts={likedProducts}
          toggleLike={toggleLike}
          setCurrentScreen={setCurrentScreen}
          setCategoryType={setCategoryType}
        />
      )}
      {currentScreen === 'category-list' && (
        <CategoryListPage
          categoryType={categoryType}
          products={categoryType === 'latest' ? newProducts : categoryType === 'hot' ? hotProducts : recommendedProducts}
          navigateToDetail={navigateToDetail}
          likedProducts={likedProducts}
          toggleLike={toggleLike}
          setCurrentScreen={setCurrentScreen}
        />
      )}
      {/* 나머지 페이지들 추가... */}

      {currentScreen !== 'detail' && currentScreen !== 'chat' && currentScreen !== 'login' && currentScreen !== 'signup' && (
        <BottomNav
          currentScreen={currentScreen}
          setCurrentScreen={setCurrentScreen}
          showRegisterMenu={showRegisterMenu}
          setShowRegisterMenu={setShowRegisterMenu}
        />
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 m-4 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-2">로그아웃</h3>
            <p className="text-gray-600 mb-6">정말 로그아웃 하시겠습니까?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-2 border border-gray-300 rounded-lg">취소</button>
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-2 bg-yellow-500 text-white rounded-lg">로그아웃</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
```

---

## 📋 체크리스트

### Phase 1: 서비스 레이어 (완료 ✅)
- [x] Firebase 설정
- [x] 채팅 서비스
- [x] API 클라이언트
- [x] 인증 API
- [x] 상품 API
- [x] 후기 API

### Phase 2: 공통 컴포넌트 (완료 ✅)
- [x] BottomNav
- [x] Header
- [x] ProductCard
- [x] ProductSection

### Phase 3: 페이지 분리 (진행중 🔄)
- [x] LoginPage
- [x] SignupPage
- [x] HomePage
- [ ] CategoryListPage
- [ ] ProductDetailPage
- [ ] ProductRegisterPage
- [ ] ProductRegisterAIPage ⭐ (중요)
- [ ] ExchangePage
- [ ] MyPage
- [ ] LikesPage
- [ ] NotificationsPage
- [ ] ChatPage
- [ ] ChatListPage
- [ ] ReviewListPage
- [ ] ReviewWritePage

### Phase 4: 최종 통합
- [ ] App.tsx 리팩토링
- [ ] 모든 페이지 import
- [ ] 라우팅 로직 연결
- [ ] 테스트

---

## 🎯 다음 단계

1. **Prototype.tsx에서 나머지 컴포넌트 복사**
   - 각 Screen 컴포넌트를 해당 페이지 파일로 복사
   - Props 타입 정의 추가
   - import 경로 수정

2. **App.tsx 통합**
   - 모든 페이지 import
   - 화면 전환 로직 연결

3. **Prototype.tsx 백업 및 제거**
   ```bash
   mv src/Prototype.tsx src/Prototype.tsx.backup
   ```

4. **테스트 및 디버깅**
   ```bash
   npm run dev
   ```

---

## 💡 유용한 팁

### 1. 빠른 컴포넌트 추출 패턴
```typescript
// Prototype.tsx에서
const SomeScreen = ({ prop1, prop2 }) => { ... }

// 새 파일로 변환
interface SomePageProps {
  prop1: Type1;
  prop2: Type2;
}

const SomePage: React.FC<SomePageProps> = ({ prop1, prop2 }) => { ... }

export default SomePage;
```

### 2. Import 경로 규칙
- 타입: `import type { X } from '../../types'`
- 컴포넌트: `import X from '../../components/...`
- 서비스: `import { x } from '../../services/...`

### 3. Props 전달 체크리스트
각 페이지에 필요한 props 확인:
- 화면 전환: `setCurrentScreen`
- 상품 관련: `products`, `navigateToDetail`, `toggleLike`
- 채팅 관련: `chatMessages`, `sendMessage`, `activeChat`
- 후기 관련: `reviews`, `setReviews`, `reviewTarget`

---

## 🔥 중요: AI 자동 등록 페이지

`ProductRegisterAIPage.tsx`는 Claude AI API를 사용하는 핵심 기능입니다.
Prototype.tsx의 `RegisterAIScreen`을 **정확히 복사**하여:

1. 이미지 업로드 기능
2. Claude API 호출 로직
3. AI 응답 파싱
4. 폼 자동 채우기

모두 유지해야 합니다.

환경 변수 확인:
```env
VITE_CLAUDE_API_KEY=your_api_key
```

---

이제 나머지 페이지들을 순차적으로 생성하시면 됩니다!
