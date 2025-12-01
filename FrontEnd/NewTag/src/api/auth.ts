import { api } from './client';

import { tokenManager } from './tokenManager';
import type { LoginRequest, LoginResponse, SignupRequest, User, ApiResponse, AuthUser } from '../types';


const handleAuthSuccess = (data: LoginResponse) => {
  if (data.success && data.token) {
    tokenManager.setSession(data.token, data.user ?? tokenManager.getCurrentUser());
  }
};

export const authApi = {
  initialize: async (): Promise<AuthUser | null> => {
    try {
      const response = await api.post<LoginResponse>('/auth/refresh');
      const data = response.data;
      if (data.success && data.token) {
        tokenManager.setSession(data.token, data.user ?? null);
        return data.user ?? null;
      }
    } catch (error) {
      // ignore - user not logged in

    }
    tokenManager.clearSession();
    return null;
  },

  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/login', credentials);
    handleAuthSuccess(response.data);
    return response.data;
  },

  signup: async (userData: SignupRequest): Promise<ApiResponse<User>> => {
    const response = await api.post<ApiResponse<User>>('/signup', userData);
    return response.data;
  },

  checkEmailAvailable: async (email: string): Promise<boolean> => {
    const response = await api.get<ApiResponse<boolean>>('/emailMatch', {
      params: { email },
    });
    return response.data.success;
  },

  checkNickAvailable: async (nick: string): Promise<boolean> => {
    const response = await api.get<ApiResponse<boolean>>('/idMatch', {
      params: { nick },
    });
    return response.data.success;
  },


  logout: async (): Promise<void> => {
    try {
      await api.post('/logout');
    } finally {
      tokenManager.clearSession();
    }
  },

  getCurrentUser: (): AuthUser | null => {
    return tokenManager.getCurrentUser();
  },

  isAuthenticated: (): boolean => {
    return !!tokenManager.getAccessToken();
  },

  /**
   * 移댁뭅??濡쒓렇??- ?몄쬆 URL濡?由щ떎?대젆??
   */
  loginWithKakao: (): void => {
    // @ts-ignore - Vite env
    const KAKAO_CLIENT_ID = import.meta.env.VITE_KAKAO_CLIENT_ID || import.meta.env.VITE_KAKAO_MAP_APP_KEY;
    const REDIRECT_URI = `${window.location.origin}/auth/kakao/callback`;

    if (!KAKAO_CLIENT_ID) {
      throw new Error('Kakao OAuth Client ID is missing.');
    }

    // 移댁뭅??OAuth ?몄쬆 ?섏씠吏濡?由щ떎?대젆??
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code`;
    window.location.href = kakaoAuthUrl;
  },

  /**
   * 移댁뭅??濡쒓렇??肄쒕갚 泥섎━ - ?몄쬆 肄붾뱶瑜?諛깆뿏?쒕줈 ?꾩넚
   */
  handleKakaoCallback: async (code: string): Promise<LoginResponse> => {
    const response = await api.get<LoginResponse>('/auth/kakao/callback', {
      params: { code },
    });
    handleAuthSuccess(response.data);
    return response.data;
  },

  /**
   * 援ш? 濡쒓렇??- ?몄쬆 URL濡?由щ떎?대젆??
   */
  loginWithGoogle: (): void => {
    // @ts-ignore - Vite env
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const REDIRECT_URI = `${window.location.origin}/auth/google/callback`;

    if (!GOOGLE_CLIENT_ID) {
      throw new Error('援ш? ?대씪?댁뼵??ID媛 ?ㅼ젙?섏? ?딆븯?듬땲??');
    }

    // 援ш? OAuth ?몄쬆 ?섏씠吏濡?由щ떎?대젆??
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=openid%20email%20profile`;
    window.location.href = googleAuthUrl;
  },

  /**
   * 援ш? 濡쒓렇??肄쒕갚 泥섎━ - ?몄쬆 肄붾뱶瑜?諛깆뿏?쒕줈 ?꾩넚
   */
  handleGoogleCallback: async (code: string): Promise<LoginResponse> => {
    const response = await api.get<LoginResponse>('/auth/google/callback', {
      params: { code },
    });
    handleAuthSuccess(response.data);
    return response.data;
  },

  /**
   * ?ㅼ씠踰?濡쒓렇??- ?몄쬆 URL濡?由щ떎?대젆??
   */
  loginWithNaver: (): void => {
    // @ts-ignore - Vite env
    const NAVER_CLIENT_ID = import.meta.env.VITE_NAVER_CLIENT_ID;
    const REDIRECT_URI = `${window.location.origin}/auth/naver/callback`;
    const STATE = Math.random().toString(36).substring(2, 15); // ?쒕뜡 state ?앹꽦

    if (!NAVER_CLIENT_ID) {
      throw new Error('?ㅼ씠踰??대씪?댁뼵??ID媛 ?ㅼ젙?섏? ?딆븯?듬땲??');
    }

    // state瑜?sessionStorage?????(CSRF 諛⑹?)
    sessionStorage.setItem('naver_oauth_state', STATE);

    // ?ㅼ씠踰?OAuth ?몄쬆 ?섏씠吏濡?由щ떎?대젆??
    const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${NAVER_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&state=${STATE}`;
    window.location.href = naverAuthUrl;
  },

  /**
   * ?ㅼ씠踰?濡쒓렇??肄쒕갚 泥섎━ - ?몄쬆 肄붾뱶瑜?諛깆뿏?쒕줈 ?꾩넚
   */
  handleNaverCallback: async (code: string, state: string): Promise<LoginResponse> => {
    // state 寃利?(CSRF 諛⑹?)
    const savedState = sessionStorage.getItem('naver_oauth_state');
    if (savedState !== state) {
      throw new Error('State 媛믪씠 ?쇱튂?섏? ?딆뒿?덈떎. ?ㅼ떆 ?쒕룄?댁＜?몄슂.');
    }
    sessionStorage.removeItem('naver_oauth_state');

    const response = await api.get<LoginResponse>('/auth/naver/callback', {
      params: { code, state },
    });
    handleAuthSuccess(response.data);
    return response.data;
  },
};

