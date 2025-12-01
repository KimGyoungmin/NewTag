// ============================================
// 상수 정의
// ============================================

// API Base URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

// Firebase Config (환경변수로 관리)
export const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Claude AI API
export const CLAUDE_API_CONFIG = {
  apiKey: import.meta.env.VITE_CLAUDE_API_KEY,
  baseUrl: 'https://api.anthropic.com/v1/messages',
  model: 'claude-sonnet-4-20250514',
};

// 카테고리는 이제 API에서 동적으로 가져옵니다
// import { categoryApi } from '../api/categoryApi'

// 제품 상태
export const PRODUCT_STATUS = {
  ON_SELL: '판매중',
  SOLD_OUT: '거래완료',
  RESERVED: '예약중',
} as const;

// 거래 상태
export const TRANSACTION_STATUS = {
  PENDING: '대기중',
  IN_PROGRESS: '거래중',
  COMPLETED: '완료',
  CANCELLED: '취소됨',
} as const;

// 소셜 로그인 제공자
export const SOCIAL_PROVIDERS = {
  GOOGLE: 'Google',
  KAKAO: 'Kakao',
  NAVER: 'Naver',
} as const;

// 이미지 설정
export const IMAGE_CONFIG = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_COUNT: 10,
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  DEFAULT_PROFILE: 'default_img.png',
  DEFAULT_PRODUCT: 'p_default_img.png',
};

// 페이지네이션
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

// 로컬 스토리지 키
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'newtag_access_token',
  REFRESH_TOKEN: 'newtag_refresh_token',
  USER_INFO: 'newtag_user_info',
  CURRENT_LOCATION: 'newtag_current_location',
};

// 알림 타입
export const NOTIFICATION_TYPE = {
  CHAT: '채팅',
  FAVORITE: '찜',
  TRANSACTION: '거래',
  REVIEW: '후기',
  SYSTEM: '시스템',
} as const;

// 평점 (0.5 ~ 5.0)
export const RATING_CONFIG = {
  MIN: 0.5,
  MAX: 5.0,
  STEP: 0.5,
};

// 신뢰 점수 등급
export const TRUST_GRADE = [
  { min: 0, max: 20, name: 'Bronze', emoji: '🥉', color: '#cd7f32' },
  { min: 20, max: 40, name: 'Silver', emoji: '🥈', color: '#c0c0c0' },
  { min: 40, max: 60, name: 'Gold', emoji: '🥇', color: '#ffd700' },
  { min: 60, max: 80, name: 'Platinum', emoji: '💎', color: '#e5e4e2' },
  { min: 80, max: 100, name: 'Diamond', emoji: '💠', color: '#b9f2ff' },
];

// 거리 범위 (km)
export const DISTANCE_RANGES = [
  { value: 1, label: '1km 이내' },
  { value: 3, label: '3km 이내' },
  { value: 5, label: '5km 이내' },
  { value: 10, label: '10km 이내' },
  { value: 999, label: '전체' },
];
