// ============================================
// 타입 정의 (DDL.sql 기반)
// ============================================

export type UserRole = 'USER' | 'ADMIN';
export type SocialProvider = 'LOCAL' | 'GOOGLE' | 'KAKAO' | 'NAVER';
export type ProductStatus = 'ON_SELL' | 'SOLD_OUT' | 'RESERVED';
export type TransactionStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

// User 타입
export interface User {
  id: number;
  name: string;
  nick: string;
  email: string;
  phone?: string;
  birth?: string;
  provider: SocialProvider;
  providerId?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  role: UserRole;
  isDelete: boolean;
  trust: number;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  profileImg: string;

  // 판매자 평점 정보 (상품 상세에서 사용)
  sellerRatingAvg?: number;
  sellerRatingCount?: number;
  sellerGrade?: string;
}

// Address 타입
export interface Address {
  id: number;
  locationNm: string;
  latitude: number;
  longitude: number;
  userId: number;
}

// Category 타입
export interface Category {
  id: number;
  categoryNm: string;
  createdAt: string;
  updatedAt: string;
}

// Product 타입
export interface Product {
  id: number;
  price: number;
  title: string;
  content: string;
  status: ProductStatus;
  locationNm: string;
  latitude: number;
  longitude: number;
  viewCount: number;
  isDelete: boolean;
  createdAt: string;
  updatedAt: string;
  sellerId: number;
  categoryId: number;

  // 조인된 데이터 (선택적)
  seller?: User;
  category?: Category;
  images?: ProductImage[];
  isFavorite?: boolean;
  favoriteCount?: number;
  likedByMe?: boolean; // 현재 사용자가 찜했는지 여부
}

// Product Image 타입
export interface ProductImage {
  id: number;
  pImg: string;
  isMain: boolean;
  createdAt: string;
  updatedAt: string;
  productId: number;
}

// Favorite 타입
export interface Favorite {
  id: number;
  createdAt: string;
  updatedAt: string;
  productId: number;
  userId: number;
  product?: Product;
}

// Transaction 타입
export interface Transaction {
  id: number;
  status: TransactionStatus;
  createdAt: string;
  updatedAt: string;
  productId: number;
  buyerId: number;
  sellerId: number;

  // 조인된 데이터
  product?: Product;
  buyer?: User;
  seller?: User;
}

// Review 타입
export interface Review {
  id: number;
  rating: number; // 1 ~ 5
  content?: string;
  createdAt: string;
  updatedAt: string;
  transactionId?: number;
  writerId: number;
  targetId: number;

  // 조인된 데이터
  transaction?: Transaction;
  writer?: User;
  target?: User;
  writerName?: string;
  writerNick?: string;
  writerProfileImg?: string;
  productTitle?: string;
}

// 평점 요약 타입
export interface RatingSummary {
  averageRating: number;
  totalCount: number;
  rating5Count: number;
  rating4Count: number;
  rating3Count: number;
  rating2Count: number;
  rating1Count: number;
}

// ============================================
// Firebase Firestore 타입 (채팅)
// ============================================

export interface ChatMessage {
  id: string;
  chatRoomId: string;
  senderId: number;
  senderNick: string;
  senderProfileImg: string;
  message: string;
  createdAt: Date;
  isRead: boolean;
}

export interface ChatRoom {
  id: string;
  productId: number;
  productTitle: string;
  productImage: string;
  productPrice: number;
  sellerId: number;
  sellerNick: string;
  sellerProfileImg: string;
  buyerId: number;
  buyerNick: string;
  buyerProfileImg: string;
  lastMessage?: string;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// 알림 타입
// ============================================

export interface Notification {
  id: string;
  userId: number;
  type: 'CHAT' | 'FAVORITE' | 'TRANSACTION' | 'REVIEW' | 'SYSTEM';
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: Date;
}

// ============================================
// API 요청/응답 타입
// ============================================

// 회원가입 요청
export interface SignupRequest {
  name: string;
  nick: string;
  email: string;
  password: string;
  phone?: string;
  birth?: string;
}

// 로그인 요청
export interface LoginRequest {
  nick: string;  // 백엔드는 nick 기반 로그인
  password: string;
}

// 로그인 세션 사용자
export type AuthUser = User;


// 로그인 응답 (백엔드 응답 형식에 맞춤)
export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user?: AuthUser;
}

// 상품 등록 요청
export interface ProductCreateRequest {
  title: string;
  content: string;
  price: number;
  categoryId: number;
  locationNm: string;
  latitude: number;
  longitude: number;
  images: File[];
}

// 상품 수정 요청
export interface ProductUpdateRequest {
  title?: string;
  content?: string;
  price?: number;
  categoryId?: number;
  status?: ProductStatus;
}

// 후기 작성 요청
export interface ReviewCreateRequest {
  transactionId: number;
  targetId: number;
  rating: number;
  content?: string;
}

// API 응답 공통 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 페이지네이션 응답
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

// ============================================
// UI 상태 타입
// ============================================

export type Screen =
  | 'login'
  | 'signup'
  | 'home'
  | 'category-list'
  | 'detail'
  | 'exchange'
  | 'likes'
  | 'notifications'
  | 'mypage'
  | 'chat'
  | 'chatlist'
  | 'reviews'
  | 'review-write'
  | 'register'
  | 'register-ai';

export interface ReviewTarget {
  productTitle: string;
  sellerName: string;
  productId: number;
  transactionId?: number;
}
