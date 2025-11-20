// ============================================
// ?€???•ì˜ (DDL.sql ê¸°ë°˜)
// ============================================

export type UserRole = 'USER' | 'ADMIN';
export type SocialProvider = 'LOCAL' | 'GOOGLE' | 'KAKAO' | 'NAVER';
export type ProductStatus = 'ON_SELL' | 'SOLD_OUT' | 'RESERVED';
export type TransactionStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

// User ?€??
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

  // ?ë§¤???‰ì  ?•ë³´ (?í’ˆ ?ì„¸?ì„œ ?¬ìš©)
  sellerRatingAvg?: number;
  sellerRatingCount?: number;
  sellerGrade?: string;
}

// Address ?€??
export interface Address {
  id: number;
  locationNm: string;
  latitude: number;
  longitude: number;
  userId: number;
}

// Category ?€??
export interface Category {
  id: number;
  categoryNm: string;
  createdAt: string;
  updatedAt: string;
}

// Product ?€??
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
  isResell?: boolean;
  createdAt: string;
  updatedAt: string;
  sellerId: number;
  categoryId: number;

  // ì¡°ì¸???°ì´??(? íƒ??
  seller?: User;
  category?: Category;
  images?: ProductImage[];
  isFavorite?: boolean;
  favoriteCount?: number;
  likedByMe?: boolean; // ?„ì¬ ?¬ìš©?ê? ì°œí–ˆ?”ì? ?¬ë?
}

// Product Image ?€??
export interface ProductImage {
  id: number;
  pImg: string;
  isMain: boolean;
  createdAt: string;
  updatedAt: string;
  productId: number;
}

// Favorite ?€??
export interface Favorite {
  id: number;
  createdAt: string;
  updatedAt: string;
  productId: number;
  userId: number;
  product?: Product;
}

// Transaction ?€??
export interface Transaction {
  id: number;
  status: TransactionStatus;
  createdAt: string;
  updatedAt: string;
  productId: number;
  buyerId: number;
  sellerId: number;

  // ì¡°ì¸???°ì´??
  product?: Product;
  buyer?: User;
  seller?: User;
}

// Review ?€??
export interface Review {
  id: number;
  rating: number; // 1 ~ 5
  content?: string;
  createdAt: string;
  updatedAt: string;
  transactionId?: number;
  writerId: number;
  targetId: number;

  // ì¡°ì¸???°ì´??
  transaction?: Transaction;
  writer?: User;
  target?: User;
  writerName?: string;
  writerNick?: string;
  writerProfileImg?: string;
  productTitle?: string;
}

// ?‰ì  ?”ì•½ ?€??
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
// Firebase Firestore Å¸ÀÔ(Ã¤ÆÃ)
// ============================================

export interface ReviewNavigationPayload {
  transactionId: number;
  targetId: number;
  productId?: number;
  productTitle?: string;
  sellerName?: string;
  sellerNick?: string;
  sellerProfileImg?: string;
  buyerId: number;
  chatId?: string;
}

export interface ChatMessage {
  id: string;
  chatRoomId: string;
  senderId: number;
  senderNick: string;
  senderProfileImg: string;
  message: string;
  createdAt: Date;
  isRead: boolean;
  messageType?: string;
  reviewPayload?: ReviewNavigationPayload | null;
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
// ?Œë¦¼ ?€??
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
// API ?”ì²­/?‘ë‹µ ?€??
// ============================================

// ?Œì›ê°€???”ì²­
export interface SignupRequest {
  name: string;
  nick: string;
  email: string;
  password: string;
  phone?: string;
  birth?: string;
}

// ë¡œê·¸???”ì²­
export interface LoginRequest {
  nick: string;  // ë°±ì—”?œëŠ” nick ê¸°ë°˜ ë¡œê·¸??
  password: string;
}

// ë¡œê·¸???¸ì…˜ ?¬ìš©??
export type AuthUser = User;


// ë¡œê·¸???‘ë‹µ (ë°±ì—”???‘ë‹µ ?•ì‹??ë§ì¶¤)
export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user?: AuthUser;
}

// ?í’ˆ ?±ë¡ ?”ì²­
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

// ?í’ˆ ?˜ì • ?”ì²­
export interface ProductUpdateRequest {
  title?: string;
  content?: string;
  price?: number;
  categoryId?: number;
  status?: ProductStatus;
}

// ?„ê¸° ?‘ì„± ?”ì²­
export interface ReviewCreateRequest {
  transactionId: number;
  targetId: number;
  rating: number;
  content?: string;
}

// API ?‘ë‹µ ê³µí†µ ?€??
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// ?˜ì´ì§€?¤ì´???‘ë‹µ
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

// ============================================
// UI ?íƒœ ?€??
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
  | 'register-ai'
  | 'select-buyer';

export interface ReviewTarget {
  productTitle: string;
  sellerName: string;
  productId: number;
  transactionId?: number;
}
