/**
 * ============================================
 * LocalStorage 관리 유틸리티
 * ============================================
 * 
 * NewTag 중고 거래 플랫폼의 모든 데이터를 관리하는 핵심 유틸리티
 * 
 * 주요 기능:
 * 1. 찜하기 (Favorites)
 * 2. 최근 검색어 (Recent Searches)
 * 3. 상품 관리 (Products - CRUD)
 * 4. 상품 상태 (판매중/예약중/판매완료)
 * 5. 상품 숨기기/비공개
 * 6. 사용자 프로필 (User Profile)
 * 7. 채팅 (Chat System)
 * 8. 후기 (Reviews)
 * 9. 판매 내역 (Sale History)
 */

// ============================================
// 타입 정의
// ============================================

/** 상품 상태 타입 */
export type ProductStatus = 'available' | 'reserved' | 'sold';

/** 상품 인터페이스 */
export interface Product {
  id: string;
  image: string;
  images?: string[];
  title: string;
  price: number;
  location: string;
  timeAgo: string;
  likes: number;
  chatCount: number;
  status: ProductStatus;
  category: string;
  description?: string;
  isResell?: boolean;
  createdAt: number;
}

/** 사용자 프로필 인터페이스 */
export interface UserProfile {
  name: string;
  nickname: string;
  profileImage: string;
  email: string;
}

/** 채팅 메시지 인터페이스 */
export interface ChatMessage {
  id: string;
  text: string;
  sender: 'me' | 'other';
  createdAt: number;
  time: string;
}

/** 채팅 인터페이스 */
export interface Chat {
  id: string;
  productId: string;
  productTitle: string;
  productPrice: number;
  productImage: string;
  productStatus: ProductStatus;
  otherUser: {
    id: string;
    name: string;
    image: string;
  };
  messages: ChatMessage[];
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  createdAt: number;
}

/** 후기 인터페이스 */
export interface Review {
  id: string;
  productId: string;
  productTitle: string;
  reviewer: string;
  reviewerImage: string;
  rating: number;
  comment: string;
  date: string;
  createdAt: number;
}

/** 판매 내역 인터페이스 */
export interface SaleHistory {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string;
  price: number;
  buyer: string;
  buyerImage: string;
  date: string;
  createdAt: number;
}

// ============================================
// 1. 찜하기 (Favorites) 관련 함수
// ============================================

/**
 * 모든 찜한 상품 ID 목록 가져오기
 * @returns 찜한 상품 ID 배열
 */
export const getFavorites = (): string[] => {
  const favorites = localStorage.getItem('favorites');
  return favorites ? JSON.parse(favorites) : [];
};

/**
 * 찜하기 토글 (추가/제거)
 * @param productId 상품 ID
 * @returns true: 추가됨, false: 제거됨
 */
export const toggleFavorite = (productId: string): boolean => {
  const favorites = getFavorites();
  const index = favorites.indexOf(productId);
  
  if (index > -1) {
    favorites.splice(index, 1);
  } else {
    favorites.push(productId);
  }
  
  localStorage.setItem('favorites', JSON.stringify(favorites));
  return index === -1;
};

/**
 * 특정 상품이 찜 목록에 있는지 확인
 * @param productId 상품 ID
 * @returns true: 찜한 상품, false: 찜하지 않은 상품
 */
export const isFavorite = (productId: string): boolean => {
  const favorites = getFavorites();
  return favorites.includes(productId);
};

// ============================================
// 2. 최근 검색어 (Recent Searches) 관련 함수
// ============================================

/**
 * 최근 검색어 목록 가져오기 (최대 10개)
 * @returns 검색어 배열
 */
export const getRecentSearches = (): string[] => {
  const searches = localStorage.getItem('recentSearches');
  return searches ? JSON.parse(searches) : [];
};

/**
 * 검색어 추가 (중복 제거, 최대 10개)
 * @param query 검색어
 */
export const addRecentSearch = (query: string): void => {
  if (!query.trim()) return;
  
  let searches = getRecentSearches();
  searches = searches.filter(s => s !== query);
  searches.unshift(query);
  searches = searches.slice(0, 10);
  
  localStorage.setItem('recentSearches', JSON.stringify(searches));
};

/**
 * 특정 검색어 제거
 * @param query 제거할 검색어
 */
export const removeRecentSearch = (query: string): void => {
  let searches = getRecentSearches();
  searches = searches.filter(s => s !== query);
  localStorage.setItem('recentSearches', JSON.stringify(searches));
};

/**
 * 모든 검색어 삭제
 */
export const clearRecentSearches = (): void => {
  localStorage.setItem('recentSearches', JSON.stringify([]));
};

// ============================================
// 3. 상품 상태 (Product Status) 관련 함수
// ============================================

interface ProductStatusData {
  [productId: string]: ProductStatus;
}

/**
 * 특정 상품의 상태 가져오기
 * @param productId 상품 ID
 * @returns 상품 상태 (기본값: 'available')
 */
export const getProductStatus = (productId: string): ProductStatus => {
  const statuses = localStorage.getItem('productStatuses');
  const statusData: ProductStatusData = statuses ? JSON.parse(statuses) : {};
  return statusData[productId] || 'available';
};

/**
 * 상품 상태 변경 (판매중/예약중/판매완료)
 * @param productId 상품 ID
 * @param status 새로운 상태
 */
export const setProductStatus = (productId: string, status: ProductStatus): void => {
  const statuses = localStorage.getItem('productStatuses');
  const statusData: ProductStatusData = statuses ? JSON.parse(statuses) : {};
  statusData[productId] = status;
  localStorage.setItem('productStatuses', JSON.stringify(statusData));
};

// ============================================
// 4. 사용자 프로필 (User Profile) 관련 함수
// ============================================

/**
 * 사용자 프로필 가져오기
 * @returns 사용자 프로필 (기본값 포함)
 */
export const getUserProfile = (): UserProfile => {
  const profile = localStorage.getItem('userProfile');
  return profile ? JSON.parse(profile) : {
    name: '홍길동',
    nickname: '길동이',
    profileImage: 'https://images.unsplash.com/photo-1640960543409-dbe56ccc30e2?w=200',
    email: 'user@newtag.com'
  };
};

/**
 * 사용자 프로필 업데이트
 * @param profile 새로운 프로필 데이터
 */
export const setUserProfile = (profile: UserProfile): void => {
  localStorage.setItem('userProfile', JSON.stringify(profile));
};

// ============================================
// 5. 상품 삭제 (Product Deletion) 관련 함수
// ============================================

/**
 * 삭제된 상품 ID 목록 가져오기
 * @returns 삭제된 상품 ID 배열
 */
export const getDeletedProducts = (): string[] => {
  const deleted = localStorage.getItem('deletedProducts');
  return deleted ? JSON.parse(deleted) : [];
};

/**
 * 상품 삭제 (논리적 삭제 - ID만 저장)
 * @param productId 삭제할 상품 ID
 */
export const deleteProduct = (productId: string): void => {
  const deleted = getDeletedProducts();
  if (!deleted.includes(productId)) {
    deleted.push(productId);
    localStorage.setItem('deletedProducts', JSON.stringify(deleted));
  }
};

/**
 * 상품이 삭제되었는지 확인
 * @param productId 상품 ID
 * @returns true: 삭제됨, false: 삭제되지 않음
 */
export const isProductDeleted = (productId: string): boolean => {
  const deleted = getDeletedProducts();
  return deleted.includes(productId);
};

// ============================================
// 6. 상품 숨기기/비공개 관련 함수
// ============================================

/**
 * 숨김 처리된 상품 ID 목록 가져오기
 * @returns 숨김 상품 ID 배열
 */
export const getHiddenProducts = (): string[] => {
  const hidden = localStorage.getItem('hiddenProducts');
  return hidden ? JSON.parse(hidden) : [];
};

/**
 * 상품 숨기기/보이기 토글
 * @param productId 상품 ID
 * @returns true: 숨김, false: 표시
 */
export const toggleProductVisibility = (productId: string): boolean => {
  const hidden = getHiddenProducts();
  const index = hidden.indexOf(productId);
  
  if (index > -1) {
    hidden.splice(index, 1);
  } else {
    hidden.push(productId);
  }
  
  localStorage.setItem('hiddenProducts', JSON.stringify(hidden));
  return index === -1;
};

/**
 * 상품이 숨김 처리되었는지 확인
 * @param productId 상품 ID
 * @returns true: 숨김, false: 표시
 */
export const isProductHidden = (productId: string): boolean => {
  const hidden = getHiddenProducts();
  return hidden.includes(productId);
};

// ============================================
// 7. 상품 수정 (Product Update) 관련 함수
// ============================================

/**
 * 상품 정보 수정
 * @param productId 상품 ID
 * @param updates 업데이트할 필드들
 */
export const updateProduct = (productId: string, updates: Partial<Product>): void => {
  const products = getRegisteredProducts();
  const index = products.findIndex(p => p.id === productId);
  
  if (index > -1) {
    products[index] = { ...products[index], ...updates };
    localStorage.setItem('registeredProducts', JSON.stringify(products));
  }
};

// ============================================
// 8. 상품 등록 및 조회 (Product CRUD) 관련 함수
// ============================================

/**
 * 사용자가 등록한 상품 목록 가져오기
 * @returns 등록된 상품 배열
 */
export const getRegisteredProducts = (): Product[] => {
  const products = localStorage.getItem('registeredProducts');
  return products ? JSON.parse(products) : [];
};

/**
 * 새 상품 등록
 * @param product 상품 정보 (id, likes, chatCount, timeAgo, createdAt 제외)
 * @returns 생성된 상품 정보
 */
export const addProduct = (product: Omit<Product, 'id' | 'likes' | 'chatCount' | 'timeAgo' | 'createdAt'>): Product => {
  const products = getRegisteredProducts();
  const newProduct: Product = {
    ...product,
    id: `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    likes: 0,
    chatCount: 0,
    timeAgo: '방금 전',
    createdAt: Date.now(),
  };
  products.unshift(newProduct);
  localStorage.setItem('registeredProducts', JSON.stringify(products));
  return newProduct;
};

/**
 * 시간 경과 계산 헬퍼 함수
 * @param createdAt 생성 시간 (timestamp)
 * @returns "방금 전", "5분 전", "2시간 전", "3일 전" 등
 */
export const getTimeAgo = (createdAt: number): string => {
  const now = Date.now();
  const diff = now - createdAt;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  return `${days}일 전`;
};

/**
 * 모든 상품 가져오기 (Mock 데이터 + 등록된 상품)
 * - 삭제된 상품 필터링
 * - 최신순 정렬
 * @returns 전체 상품 배열
 */
export const getAllProducts = (): Product[] => {
  const registered = getRegisteredProducts();
  const mockProducts = getMockProducts();
  
  const deletedIds = getDeletedProducts();
  const allProducts = [...registered, ...mockProducts].filter(
    p => !deletedIds.includes(p.id)
  );
  
  return allProducts.sort((a, b) => b.createdAt - a.createdAt);
};

/**
 * ID로 특정 상품 가져오기
 * @param productId 상품 ID
 * @returns 상품 정보 또는 null
 */
export const getProductById = (productId: string): Product | null => {
  const allProducts = getAllProducts();
  return allProducts.find(p => p.id === productId) || null;
};

// ============================================
// 9. Mock 데이터 생성 및 관리
// ============================================

/**
 * 초기 Mock 상품 데이터 생성 및 반환
 * @returns Mock 상품 배열
 */
export const getMockProducts = (): Product[] => {
  const mockProducts = localStorage.getItem('mockProducts');
  if (mockProducts) {
    return JSON.parse(mockProducts);
  }
  
  // 초기 데이터 생성
  const initialProducts: Product[] = [
    {
      id: 'mock-1',
      image: 'https://images.unsplash.com/photo-1758186355698-bd0183fc75ed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBlbGVjdHJvbmljcyUyMGdhZGdldHxlbnwxfHx8fDE3NjIxNjI0OTh8MA&ixlib=rb-4.1.0&q=80&w=1080',
      title: '아이패드 프로 11인치 M2칩 (2022)',
      price: 850000,
      location: '강남구 역삼동',
      timeAgo: '1시간 전',
      likes: 12,
      chatCount: 5,
      status: 'available',
      category: 'electronics',
      description: '거의 새것입니다. 보호필름 부착되어 있고, 케이스도 같이 드립니다.',
      createdAt: Date.now() - 3600000, // 1시간 전
    },
    {
      id: 'mock-2',
      image: 'https://images.unsplash.com/photo-1634824506573-4a430d1d6111?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmdXJuaXR1cmUlMjBob21lJTIwZGVjb3J8ZW58MXx8fHwxNzYyMTgwNjcxfDA&ixlib=rb-4.1.0&q=80&w=1080',
      title: '북유럽 스타일 원목 책상',
      price: 120000,
      location: '서초구 방배동',
      timeAgo: '3시간 전',
      likes: 8,
      chatCount: 3,
      status: 'available',
      category: 'furniture',
      description: '이사로 인해 판매합니다. 사용감 거의 없어요.',
      createdAt: Date.now() - 10800000, // 3시간 전
    },
    {
      id: 'mock-3',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
      title: '나이키 에어맥스 270 (새상품)',
      price: 89000,
      location: '강남구 청담동',
      timeAgo: '5시간 전',
      likes: 15,
      chatCount: 7,
      status: 'reserved',
      category: 'fashion',
      description: '사이즈 안맞아서 팝니다. 한번도 신지 않은 새상품입니다.',
      createdAt: Date.now() - 18000000, // 5시간 전
    },
    {
      id: 'mock-4',
      image: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=500',
      title: '다이슨 V11 무선청소기',
      price: 350000,
      location: '송파구 잠실동',
      timeAgo: '1일 전',
      likes: 20,
      chatCount: 12,
      status: 'available',
      category: 'appliances',
      description: '작년에 구매했고 상태 좋습니다. 필터 새것으로 교체했어요.',
      createdAt: Date.now() - 86400000, // 1일 전
    },
    {
      id: 'mock-5',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
      title: '소니 WH-1000XM5 헤드폰',
      price: 280000,
      location: '강남구 역삼동',
      timeAgo: '2일 전',
      likes: 18,
      chatCount: 9,
      status: 'sold',
      category: 'electronics',
      description: '노이즈 캔슬링 최고입니다. 거의 새것이에요.',
      createdAt: Date.now() - 172800000, // 2일 전
    },
    {
      id: 'mock-6',
      image: 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=500',
      title: '캐논 EOS R6 미러리스 카메라',
      price: 1800000,
      location: '강남구 삼성동',
      timeAgo: '3일 전',
      likes: 25,
      chatCount: 15,
      status: 'available',
      category: 'electronics',
      description: '셔터수 5천 미만. 매우 깨끗한 상태입니다.',
      createdAt: Date.now() - 259200000, // 3일 전
    },
  ];
  
  localStorage.setItem('mockProducts', JSON.stringify(initialProducts));
  return initialProducts;
};

// ============================================
// 10. 채팅 시스템 (Chat System) 관련 함수
// ============================================

/**
 * Mock 채팅 데이터 생성 및 반환
 * @returns Mock 채팅 배열
 */
export const getMockChats = (): Chat[] => {
  const mockChats = localStorage.getItem('mockChats');
  if (mockChats) {
    return JSON.parse(mockChats);
  }
  
  const initialChats: Chat[] = [
    {
      id: 'chat-1',
      productId: 'mock-1',
      productTitle: '아이패드 프로 11인치 M2칩 (2022)',
      productPrice: 850000,
      productImage: 'https://images.unsplash.com/photo-1758186355698-bd0183fc75ed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBlbGVjdHJvbmljcyUyMGdhZGdldHxlbnwxfHx8fDE3NjIxNjI0OTh8MA&ixlib=rb-4.1.0&q=80&w=1080',
      productStatus: 'available',
      otherUser: {
        id: 'user-1',
        name: '김철수',
        image: 'https://images.unsplash.com/photo-1640960543409-dbe56ccc30e2?w=200',
      },
      messages: [
        {
          id: 'msg-1',
          text: '안녕하세요! 아이패드 구매 희망합니다.',
          sender: 'other',
          createdAt: Date.now() - 7200000,
          time: '오후 2:30',
        },
        {
          id: 'msg-2',
          text: '네, 연락주셔서 감사합니다!',
          sender: 'me',
          createdAt: Date.now() - 7100000,
          time: '오후 2:32',
        },
        {
          id: 'msg-3',
          text: '직거래 가능한가요?',
          sender: 'other',
          createdAt: Date.now() - 3600000,
          time: '오후 3:30',
        },
      ],
      lastMessage: '직거래 가능한가요?',
      lastMessageTime: '1시간 전',
      unreadCount: 1,
      createdAt: Date.now() - 7200000,
    },
    {
      id: 'chat-2',
      productId: 'mock-2',
      productTitle: '북유럽 스타일 원목 책상',
      productPrice: 120000,
      productImage: 'https://images.unsplash.com/photo-1634824506573-4a430d1d6111?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmdXJuaXR1cmUlMjBob21lJTIwZGVjb3J8ZW58MXx8fHwxNzYyMTgwNjcxfDA&ixlib=rb-4.1.0&q=80&w=1080',
      productStatus: 'available',
      otherUser: {
        id: 'user-2',
        name: '이영희',
        image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
      },
      messages: [
        {
          id: 'msg-4',
          text: '책상 실제로 보고 살 수 있을까요?',
          sender: 'other',
          createdAt: Date.now() - 3600000,
          time: '오후 3:00',
        },
        {
          id: 'msg-5',
          text: '네, 가능합니다. 언제 편하세요?',
          sender: 'me',
          createdAt: Date.now() - 1800000,
          time: '오후 3:30',
        },
      ],
      lastMessage: '네, 가능합니다. 언제 편하세요?',
      lastMessageTime: '30분 전',
      unreadCount: 0,
      createdAt: Date.now() - 3600000,
    },
  ];
  
  localStorage.setItem('mockChats', JSON.stringify(initialChats));
  return initialChats;
};

/**
 * 모든 채팅 가져오기
 * @returns 전체 채팅 배열
 */
export const getAllChats = (): Chat[] => {
  return getMockChats();
};

/**
 * ID로 특정 채팅 가져오기
 * @param chatId 채팅 ID
 * @returns 채팅 정보 또는 undefined
 */
export const getChatById = (chatId: string): Chat | undefined => {
  const allChats = getAllChats();
  return allChats.find(c => c.id === chatId);
};

/**
 * 채팅에 메시지 추가
 * @param chatId 채팅 ID
 * @param message 메시지 정보 (id, createdAt 제외)
 */
export const addMessageToChat = (chatId: string, message: Omit<ChatMessage, 'id' | 'createdAt'>): void => {
  const chats = getAllChats();
  const chatIndex = chats.findIndex(c => c.id === chatId);
  
  if (chatIndex === -1) return;
  
  const newMessage: ChatMessage = {
    ...message,
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
  };
  
  chats[chatIndex].messages.push(newMessage);
  chats[chatIndex].lastMessage = message.text;
  chats[chatIndex].lastMessageTime = '방금 전';
  
  localStorage.setItem('mockChats', JSON.stringify(chats));
};

/**
 * 특정 상품/판매자와의 채팅방 찾기 또는 생성
 * @param productId 상품 ID
 * @param product 상품 정보
 * @param seller 판매자 정보
 * @returns 채팅 ID
 */
export const findOrCreateChat = (productId: string, product: Product, seller: { id: string; name: string; image: string }): string => {
  const chats = getAllChats();
  
  // 기존 채팅 찾기
  const existingChat = chats.find(c => c.productId === productId);
  if (existingChat) {
    return existingChat.id;
  }
  
  // 새 채팅 생성
  const newChat: Chat = {
    id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    productId,
    productTitle: product.title,
    productPrice: product.price,
    productImage: product.image,
    productStatus: product.status,
    otherUser: seller,
    messages: [],
    lastMessage: '',
    lastMessageTime: '방금 전',
    unreadCount: 0,
    createdAt: Date.now(),
  };
  
  chats.unshift(newChat);
  localStorage.setItem('mockChats', JSON.stringify(chats));
  
  return newChat.id;
};

/**
 * 채팅방 삭제
 * @param chatId 삭제할 채팅 ID
 */
export const deleteChat = (chatId: string): void => {
  const chats = getAllChats();
  const filteredChats = chats.filter(c => c.id !== chatId);
  localStorage.setItem('mockChats', JSON.stringify(filteredChats));
};

/**
 * 채팅 읽음 처리 (unreadCount를 0으로 설정)
 * @param chatId 채팅 ID
 */
export const markChatAsRead = (chatId: string): void => {
  const chats = getAllChats();
  const chatIndex = chats.findIndex(c => c.id === chatId);
  
  if (chatIndex !== -1) {
    chats[chatIndex].unreadCount = 0;
    localStorage.setItem('mockChats', JSON.stringify(chats));
  }
};

// ============================================
// 11. 후기 시스템 (Review System) 관련 함수
// ============================================

/**
 * 모든 후기 가져오기
 * @returns 후기 배열
 */
export const getReviews = (): Review[] => {
  const reviews = localStorage.getItem('reviews');
  return reviews ? JSON.parse(reviews) : [];
};

/**
 * 새 후기 추가
 * @param review 후기 정보 (id, createdAt 제외)
 */
export const addReview = (review: Omit<Review, 'id' | 'createdAt'>): void => {
  const reviews = getReviews();
  const newReview: Review = {
    ...review,
    id: `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
  };
  reviews.unshift(newReview);
  localStorage.setItem('reviews', JSON.stringify(reviews));
};

// ============================================
// 12. 판매 내역 (Sale History) 관련 함수
// ============================================

/**
 * 모든 판매 내역 가져오기
 * @returns 판매 내역 배열
 */
export const getSaleHistory = (): SaleHistory[] => {
  const sales = localStorage.getItem('saleHistory');
  return sales ? JSON.parse(sales) : [];
};

/**
 * 새 판매 내역 추가
 * @param sale 판매 내역 정보 (id, createdAt 제외)
 */
export const addSaleHistory = (sale: Omit<SaleHistory, 'id' | 'createdAt'>): void => {
  const sales = getSaleHistory();
  const newSale: SaleHistory = {
    ...sale,
    id: `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
  };
  sales.unshift(newSale);
  localStorage.setItem('saleHistory', JSON.stringify(sales));
};
