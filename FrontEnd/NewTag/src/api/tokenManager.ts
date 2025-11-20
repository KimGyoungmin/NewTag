import type { AuthUser } from '../types';

type Listener = () => void;

// LocalStorage 키
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'current_user';

// 메모리 캐시
let accessToken: string | null = null;
let refreshToken: string | null = null;
let currentUser: AuthUser | null = null;
const listeners = new Set<Listener>();

/**
 * LocalStorage에서 초기 상태 로드
 */
const loadFromStorage = () => {
  if (typeof window === 'undefined') return;

  try {
    accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    const userStr = localStorage.getItem(USER_KEY);
    if (userStr) {
      currentUser = JSON.parse(userStr);
    }
  } catch (error) {
    console.error('[tokenManager] Failed to load from storage:', error);
  }
};

/**
 * LocalStorage에 저장
 */
const saveToStorage = () => {
  if (typeof window === 'undefined') return;

  try {
    if (accessToken) {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    } else {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    }

    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }

    if (currentUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  } catch (error) {
    console.error('[tokenManager] Failed to save to storage:', error);
  }
};

/**
 * 인증 상태 변경 알림
 */
const notify = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('auth-change'));
  }
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      console.error('[tokenManager] listener error', error);
    }
  });
};

// 초기화 시 LocalStorage에서 로드
loadFromStorage();

export const tokenManager = {
  /**
   * Access Token 조회
   */
  getAccessToken: () => accessToken,

  /**
   * Refresh Token 조회
   */
  getRefreshToken: () => refreshToken,

  /**
   * 현재 사용자 정보 조회
   */
  getCurrentUser: () => currentUser,

  /**
   * 세션 설정 (로그인 시)
   */
  setSession: (token: string | null, user?: AuthUser | null, refresh?: string | null) => {
    accessToken = token;

    if (typeof refresh !== 'undefined') {
      refreshToken = refresh;
    }

    if (typeof user !== 'undefined') {
      currentUser = user;
    }

    saveToStorage();
    notify();
  },

  /**
   * Access Token만 갱신 (Refresh 시)
   */
  setAccessToken: (token: string) => {
    accessToken = token;
    saveToStorage();
    // Access Token 갱신은 조용히 처리 (notify 하지 않음)
  },

  /**
   * 세션 초기화 (로그아웃 시)
   */
  clearSession: () => {
    accessToken = null;
    refreshToken = null;
    currentUser = null;

    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }

    notify();
  },

  /**
   * 인증 상태 변경 구독
   */
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export type TokenManager = typeof tokenManager;
