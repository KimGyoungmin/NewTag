# Prototype.tsx 리팩토링 가이드

## 📂 폴더 구조

```
src/
├── types/
│   └── index.ts              ✅ 완료 - 타입 정의 (DDL 기반)
│
├── constants/
│   └── index.ts              ✅ 완료 - 상수 정의
│
├── components/
│   ├── common/
│   │   ├── BottomNav.tsx     ✅ 완료 - 하단 네비게이션
│   │   ├── Header.tsx        ✅ 완료 - 공통 헤더
│   │   └── LoadingSpinner.tsx   TODO - 로딩 스피너
│   │
│   ├── product/
│   │   ├── ProductCard.tsx   ✅ 완료 - 상품 카드
│   │   ├── ProductSection.tsx   TODO - 상품 섹션
│   │   └── ProductList.tsx      TODO - 상품 목록
│   │
│   ├── auth/
│   │   └── SocialLoginButtons.tsx TODO - 소셜 로그인 버튼
│   │
│   ├── chat/
│   │   ├── ChatBubble.tsx       TODO - 채팅 말풍선
│   │   └── ChatInput.tsx        TODO - 채팅 입력창
│   │
│   └── review/
│       ├── StarRating.tsx       TODO - 별점 컴포넌트
│       └── ReviewCard.tsx       TODO - 후기 카드
│
├── pages/
│   ├── auth/
│   │   ├── LoginPage.tsx     ✅ 완료
│   │   └── SignupPage.tsx       TODO
│   │
│   ├── home/
│   │   ├── HomePage.tsx         TODO
│   │   └── CategoryListPage.tsx TODO
│   │
│   ├── product/
│   │   ├── ProductDetailPage.tsx   TODO
│   │   ├── ProductRegisterPage.tsx TODO
│   │   ├── ProductRegisterAIPage.tsx TODO
│   │   └── ExchangePage.tsx        TODO
│   │
│   ├── chat/
│   │   ├── ChatPage.tsx            TODO
│   │   └── ChatListPage.tsx        TODO
│   │
│   ├── mypage/
│   │   ├── MyPage.tsx              TODO
│   │   ├── LikesPage.tsx           TODO
│   │   └── NotificationsPage.tsx   TODO
│   │
│   └── review/
│       ├── ReviewListPage.tsx      TODO
│       └── ReviewWritePage.tsx     TODO
│
├── services/
│   ├── api/
│   │   ├── client.ts            TODO - Axios 설정
│   │   ├── authApi.ts           TODO - 인증 API
│   │   ├── productApi.ts        TODO - 상품 API
│   │   ├── userApi.ts           TODO - 유저 API
│   │   └── reviewApi.ts         TODO - 후기 API
│   │
│   └── firebase/
│       ├── config.ts            TODO - Firebase 설정
│       ├── chatService.ts       TODO - 채팅 서비스
│       └── notificationService.ts TODO - 알림 서비스
│
├── hooks/
│   ├── useAuth.ts               TODO - 인증 훅
│   ├── useChat.ts               TODO - 채팅 훅
│   └── useLocation.ts           TODO - 위치 훅
│
├── utils/
│   ├── distance.ts              TODO - 거리 계산
│   ├── formatter.ts             TODO - 포맷 유틸
│   └── storage.ts               TODO - 로컬스토리지 유틸
│
└── App.tsx                      TODO - 메인 앱 리팩토링
```

---

## 🔄 리팩토링 진행 단계

### 1단계: 기반 작업 (완료됨 ✅)
- [x] 타입 정의 (`types/index.ts`)
- [x] 상수 정의 (`constants/index.ts`)
- [x] 공통 컴포넌트 (BottomNav, Header, ProductCard)
- [x] LoginPage

### 2단계: 서비스 레이어 구축 (다음 작업)
Firebase와 Backend API 연동을 위한 서비스 레이어

#### Firebase Firestore 서비스 (`services/firebase/`)
```typescript
// services/firebase/config.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { FIREBASE_CONFIG } from '../../constants';

export const app = initializeApp(FIREBASE_CONFIG);
export const db = getFirestore(app);
```

```typescript
// services/firebase/chatService.ts
import { collection, addDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from './config';
import type { ChatMessage, ChatRoom } from '../../types';

export const chatService = {
  // 채팅방 생성
  createChatRoom: async (chatRoom: Omit<ChatRoom, 'id'>) => {
    const docRef = await addDoc(collection(db, 'chatRooms'), chatRoom);
    return docRef.id;
  },

  // 메시지 전송
  sendMessage: async (message: Omit<ChatMessage, 'id'>) => {
    const docRef = await addDoc(collection(db, 'messages'), message);
    return docRef.id;
  },

  // 실시간 메시지 구독
  subscribeToMessages: (chatRoomId: string, callback: (messages: ChatMessage[]) => void) => {
    const q = query(
      collection(db, 'messages'),
      where('chatRoomId', '==', chatRoomId),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[];
      callback(messages);
    });
  },
};
```

#### Backend API 서비스 (`services/api/`)
```typescript
// services/api/client.ts
import axios from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from '../../constants';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request 인터셉터: 토큰 자동 추가
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response 인터셉터: 에러 처리
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 토큰 만료 시 로그인 페이지로 이동
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

```typescript
// services/api/productApi.ts
import { apiClient } from './client';
import type { Product, ProductCreateRequest, ProductUpdateRequest } from '../../types';

export const productApi = {
  // 상품 목록 조회
  getProducts: async (params?: { page?: number; size?: number; categoryId?: number }) => {
    const response = await apiClient.get<Product[]>('/api/products', { params });
    return response.data;
  },

  // 상품 상세 조회
  getProductById: async (id: number) => {
    const response = await apiClient.get<Product>(`/api/products/${id}`);
    return response.data;
  },

  // 상품 등록
  createProduct: async (data: ProductCreateRequest) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'images' && Array.isArray(value)) {
        value.forEach((file) => formData.append('images', file));
      } else {
        formData.append(key, String(value));
      }
    });

    const response = await apiClient.post<Product>('/api/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // 상품 수정
  updateProduct: async (id: number, data: ProductUpdateRequest) => {
    const response = await apiClient.put<Product>(`/api/products/${id}`, data);
    return response.data;
  },

  // 상품 삭제
  deleteProduct: async (id: number) => {
    await apiClient.delete(`/api/products/${id}`);
  },

  // 찜하기/취소
  toggleFavorite: async (productId: number) => {
    const response = await apiClient.post(`/api/products/${productId}/favorite`);
    return response.data;
  },
};
```

### 3단계: 페이지 컴포넌트 분리

Prototype.tsx의 각 화면을 독립적인 페이지로 분리:

#### HomePage 예시
```typescript
// pages/home/HomePage.tsx
import React from 'react';
import { Search, MapPin, Repeat, Navigation } from 'lucide-react';
import ProductSection from '../../components/product/ProductSection';
import type { Product, Screen } from '../../types';

interface HomePageProps {
  newProducts: Product[];
  hotProducts: Product[];
  recommendedProducts: Product[];
  navigateToDetail: (product: Product) => void;
  likedProducts: number[];
  toggleLike: (id: number) => void;
  setCurrentScreen: (screen: Screen) => void;
  setCategoryType: (type: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({
  newProducts,
  hotProducts,
  recommendedProducts,
  navigateToDetail,
  likedProducts,
  toggleLike,
  setCurrentScreen,
  setCategoryType,
}) => {
  const handleViewAll = (type: string) => {
    setCategoryType(type);
    setCurrentScreen('category-list');
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-400 text-white p-4">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">🏷️</span> NEWTAG
          </h1>
          <div className="flex gap-3">
            <button onClick={() => setCurrentScreen('exchange')}><Repeat className="w-6 h-6" /></button>
            <button><Navigation className="w-6 h-6" /></button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="상품명 검색..." className="w-full pl-10 pr-4 py-2 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-white" />
        </div>
      </div>

      <div className="bg-gray-50 px-4 py-3 flex items-center gap-3 border-b">
        <MapPin className="w-5 h-5 text-yellow-600" />
        <span className="text-sm font-medium">강남구</span>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50">
        <ProductSection
          title="🆕 최신 상품"
          products={newProducts}
          navigateToDetail={navigateToDetail}
          likedProducts={likedProducts}
          toggleLike={toggleLike}
          onViewAll={() => handleViewAll('latest')}
        />

        <ProductSection
          title="🔥 핫딜 상품"
          products={hotProducts}
          navigateToDetail={navigateToDetail}
          likedProducts={likedProducts}
          toggleLike={toggleLike}
          onViewAll={() => handleViewAll('hot')}
        />

        <ProductSection
          title="⭐ 추천 상품"
          products={recommendedProducts}
          navigateToDetail={navigateToDetail}
          likedProducts={likedProducts}
          toggleLike={toggleLike}
          onViewAll={() => handleViewAll('recommended')}
        />
      </div>
    </div>
  );
};

export default HomePage;
```

### 4단계: App.tsx 리팩토링

```typescript
// App.tsx
import React, { useState } from 'react';
import BottomNav from './components/common/BottomNav';
import LoginPage from './pages/auth/LoginPage';
import HomePage from './pages/home/HomePage';
// ... 기타 import
import type { Screen, Product } from './types';

const App = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [showRegisterMenu, setShowRegisterMenu] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  // ... 기타 상태

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen flex flex-col shadow-2xl">
      {currentScreen === 'login' && <LoginPage setCurrentScreen={setCurrentScreen} />}
      {currentScreen === 'home' && <HomePage {...homeProps} />}
      {/* ... 기타 페이지 */}

      {currentScreen !== 'detail' && currentScreen !== 'chat' && currentScreen !== 'login' && currentScreen !== 'signup' && (
        <BottomNav
          currentScreen={currentScreen}
          setCurrentScreen={setCurrentScreen}
          showRegisterMenu={showRegisterMenu}
          setShowRegisterMenu={setShowRegisterMenu}
        />
      )}
    </div>
  );
};

export default App;
```

---

## 🔥 Firebase 설정

### 1. Firebase 프로젝트 생성
1. [Firebase Console](https://console.firebase.google.com/)에서 프로젝트 생성
2. Firestore Database 활성화
3. 프로젝트 설정 → 웹 앱 추가 → Config 복사

### 2. 환경 변수 설정
`.env` 파일 생성:
```env
VITE_API_BASE_URL=http://localhost:8080
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_CLAUDE_API_KEY=your_claude_api_key
```

### 3. Firestore 데이터 구조
```
chatRooms/
  {chatRoomId}/
    id: string
    productId: number
    sellerId: number
    buyerId: number
    ...

messages/
  {messageId}/
    id: string
    chatRoomId: string
    senderId: number
    message: string
    createdAt: timestamp
    isRead: boolean
```

---

## 🚀 다음 단계

1. **Firebase 패키지 설치**
   ```bash
   npm install firebase
   ```

2. **API 클라이언트 패키지 설치**
   ```bash
   npm install axios
   ```

3. **서비스 레이어 구축**
   - Firebase Firestore 서비스 생성
   - Backend API 서비스 생성

4. **페이지 컴포넌트 분리**
   - 각 화면을 독립적인 페이지로 분리
   - Props 정의 및 타입 안정성 확보

5. **상태 관리 개선 (선택사항)**
   - Context API 또는 Zustand 도입
   - 전역 상태 관리 최적화

---

## 📝 주요 리팩토링 포인트

### 1. DDL과 타입의 일치
- MySQL DDL 스키마와 TypeScript 타입이 정확히 일치
- snake_case → camelCase 변환 규칙 통일

### 2. Firebase Firestore 채팅
- 실시간 메시지 동기화
- 읽음 표시 처리
- 채팅방 목록 관리

### 3. API 통신
- Axios 인터셉터로 토큰 관리
- 에러 핸들링 표준화
- FormData 처리 (이미지 업로드)

### 4. 컴포넌트 분리 원칙
- 페이지: 라우팅 단위의 큰 화면
- 컴포넌트: 재사용 가능한 UI 조각
- 서비스: 비즈니스 로직 및 API 호출

---

## ⚠️ 주의사항

1. **환경변수 보안**
   - `.env` 파일은 `.gitignore`에 추가
   - Firebase API Key는 도메인 제한 설정

2. **이미지 처리**
   - 프로토타입의 emoji는 실제 이미지로 대체
   - S3 또는 Firebase Storage 연동

3. **타입 안정성**
   - `any` 타입 사용 최소화
   - API 응답 타입 정의 필수

4. **성능 최적화**
   - React.memo 활용
   - useCallback/useMemo 적절히 사용
   - 무한 스크롤 구현 시 가상화 고려
