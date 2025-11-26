// ============================================
// ????뺤쓽 (DDL.sql 湲곕컲)
// ============================================

export type UserRole = 'USER' | 'ADMIN';
export type SocialProvider = 'LOCAL' | 'GOOGLE' | 'KAKAO' | 'NAVER';
export type ProductStatus = 'ON_SELL' | 'SOLD_OUT' | 'RESERVED';
export type TransactionStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

// User ???
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

  // ?먮ℓ???됱젏 ?뺣낫 (?곹뭹 ?곸꽭?먯꽌 ?ъ슜)
  sellerRatingAvg?: number;
  sellerRatingCount?: number;
  sellerGrade?: string;
}

// Address ???
export interface Address {
  id: number;
  locationNm: string;
  latitude: number;
  longitude: number;
  userId: number;
}

// Category ???
export interface Category {
  id: number;
  categoryNm: string;
  createdAt: string;
  updatedAt: string;
}

// Product ???
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
  mainImage?: string;
  thumbnailImage?: string;

  // 議곗씤???곗씠??(?좏깮??
  seller?: User;
  category?: Category;
  images?: ProductImage[];
  isFavorite?: boolean;
  favoriteCount?: number;
  likedByMe?: boolean; // ?꾩옱 ?ъ슜?먭? 李쒗뻽?붿? ?щ?
}

// Product Image ???
export interface ProductImage {
  id: number;
  pImg: string;
  isMain: boolean;
  createdAt: string;
  updatedAt: string;
  productId: number;
  thumbnailPath?: string;
}

// Favorite ???
export interface Favorite {
  id: number;
  createdAt: string;
  updatedAt: string;
  productId: number;
  userId: number;
  product?: Product;
}

// Transaction ???
export interface Transaction {
  id: number;
  status: TransactionStatus;
  createdAt: string;
  updatedAt: string;
  productId: number;
  buyerId: number;
  sellerId: number;

  // 議곗씤???곗씠??
  product?: Product;
  buyer?: User;
  seller?: User;
}

// Review ???
export interface Review {
  id: number;
  rating: number; // 1 ~ 5
  content?: string;
  createdAt: string;
  updatedAt: string;
  transactionId?: number;
  writerId: number;
  targetId: number;

  // 議곗씤???곗씠??
  transaction?: Transaction;
  writer?: User;
  target?: User;
  writerName?: string;
  writerNick?: string;
  writerProfileImg?: string;
  productTitle?: string;
}

// ?됱젏 ?붿빟 ???
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
// Firebase Firestore 타입(채팅)
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
  reviewCompleted?: boolean;
  isReviewed?: boolean;
}

export interface ChatLocation {
  lat: number;
  lng: number;
  address?: string;
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
  imageUrl?: string;
  location?: ChatLocation | null;
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
// ?뚮┝ ???
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
// API ?붿껌/?묐떟 ???
// ============================================

// ?뚯썝媛???붿껌
export interface SignupRequest {
  name: string;
  nick: string;
  email: string;
  password: string;
  phone?: string;
  birth?: string;
}

// 濡쒓렇???붿껌
export interface LoginRequest {
  nick: string;  // 諛깆뿏?쒕뒗 nick 湲곕컲 濡쒓렇??
  password: string;
}

// 濡쒓렇???몄뀡 ?ъ슜??
export type AuthUser = User;


// 濡쒓렇???묐떟 (諛깆뿏???묐떟 ?뺤떇??留욎땄)
export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user?: AuthUser;
}

// ?곹뭹 ?깅줉 ?붿껌
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

// ?곹뭹 ?섏젙 ?붿껌
export interface ProductUpdateRequest {
  title?: string;
  content?: string;
  price?: number;
  categoryId?: number;
  status?: ProductStatus;
}

// ?꾧린 ?묒꽦 ?붿껌
export interface ReviewCreateRequest {
  transactionId: number;
  targetId: number;
  rating: number;
  content?: string;
}

// API ?묐떟 怨듯넻 ???
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// ?섏씠吏?ㅼ씠???묐떟
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

// ============================================
// UI ?곹깭 ???
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

