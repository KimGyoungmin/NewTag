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
   * 카카오 로그인 - 인증 URL로 리다이렉트
   */
  loginWithKakao: (): void => {
    // @ts-ignore - Vite env
    const KAKAO_CLIENT_ID = import.meta.env.VITE_KAKAO_CLIENT_ID;
    const DOMAIN_NAME = import.meta.env.VITE_DOMAIN_NAME || 'http://localhost';
    const REDIRECT_URI = `${DOMAIN_NAME}/api/v1/auth/kakao/callback`;

    if (!KAKAO_CLIENT_ID) {
      throw new Error('Kakao OAuth Client ID is missing.');
    }

    // 카카오 OAuth 인증 페이지로 리다이렉트
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code`;
    window.location.href = kakaoAuthUrl;
  },

  /**
   * 카카오 로그인 콜백 처리 - 인증 코드를 백엔드로 전송
   */
  handleKakaoCallback: async (code: string): Promise<LoginResponse> => {
    const response = await api.get<LoginResponse>('/auth/kakao/callback', {
      params: { code },
    });
    handleAuthSuccess(response.data);
    return response.data;
  },

  /**
   * 구글 로그인 - 인증 URL로 리다이렉트
   */
  loginWithGoogle: (): void => {
    // @ts-ignore - Vite env
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const DOMAIN_NAME = import.meta.env.VITE_DOMAIN_NAME || 'http://localhost';
    const REDIRECT_URI = `${DOMAIN_NAME}/api/v1/auth/google/callback`;

    if (!GOOGLE_CLIENT_ID) {
      throw new Error('구글 클라이언트 ID가 설정되지 않았습니다');
    }

    // 구글 OAuth 인증 페이지로 리다이렉트
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=openid%20email%20profile`;
    window.location.href = googleAuthUrl;
  },

  /**
   * 구글 로그인 콜백 처리 - 인증 코드를 백엔드로 전송
   */
  handleGoogleCallback: async (code: string): Promise<LoginResponse> => {
    const response = await api.get<LoginResponse>('/auth/google/callback', {
      params: { code },
    });
    handleAuthSuccess(response.data);
    return response.data;
  },

  /**
   * 네이버 로그인 - 인증 URL로 리다이렉트
   */
  loginWithNaver: (): void => {
    // @ts-ignore - Vite env
    const NAVER_CLIENT_ID = import.meta.env.VITE_NAVER_CLIENT_ID;
    const DOMAIN_NAME = import.meta.env.VITE_DOMAIN_NAME || 'http://localhost';
    const REDIRECT_URI = `${DOMAIN_NAME}/api/v1/auth/naver/callback`;
    const STATE = Math.random().toString(36).substring(2, 15); // 랜덤 state 생성

    if (!NAVER_CLIENT_ID) {
      throw new Error('네이버 클라이언트 ID가 설정되지 않았습니다');
    }

    // state를 sessionStorage에 저장 (CSRF 방지)
    sessionStorage.setItem('naver_oauth_state', STATE);

    // 네이버 OAuth 인증 페이지로 리다이렉트
    const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${NAVER_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&state=${STATE}`;
    window.location.href = naverAuthUrl;
  },

  /**
   * 네이버 로그인 콜백 처리 - 인증 코드를 백엔드로 전송
   */
  handleNaverCallback: async (code: string, state: string): Promise<LoginResponse> => {
    // state 검증 (CSRF 방지)
    const savedState = sessionStorage.getItem('naver_oauth_state');
    if (savedState !== state) {
      throw new Error('State 값이 일치하지 않습니다. 다시 시도해주세요.');
    }
    sessionStorage.removeItem('naver_oauth_state');

    const response = await api.get<LoginResponse>('/auth/naver/callback', {
      params: { code, state },
    });
    handleAuthSuccess(response.data);
    return response.data;
  },
};
