import { api } from './client';
import { tokenManager } from './tokenManager';
import type { LoginRequest, LoginResponse, SignupRequest, User, ApiResponse, AuthUser } from '../types';

const DOMAIN_NAME = import.meta.env.VITE_DOMAIN_NAME || 'http://localhost';

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

  loginWithKakao: (): void => {
    const KAKAO_CLIENT_ID = import.meta.env.VITE_KAKAO_CLIENT_ID;
    const REDIRECT_URI = `${DOMAIN_NAME}/api/v1/auth/kakao/callback`;

    if (!KAKAO_CLIENT_ID) {
      throw new Error('Kakao OAuth Client ID is missing.');
    }

    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code`;
    window.location.href = kakaoAuthUrl;
  },

  handleKakaoCallback: async (code: string): Promise<LoginResponse> => {
    const response = await api.get<LoginResponse>('/auth/kakao/callback', {
      params: { code },
    });
    handleAuthSuccess(response.data);
    return response.data;
  },

  loginWithGoogle: (): void => {
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const REDIRECT_URI = `${DOMAIN_NAME}/api/v1/auth/google/callback`;

    if (!GOOGLE_CLIENT_ID) {
      throw new Error('Google Client ID is not configured.');
    }

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=openid%20email%20profile`;
    window.location.href = googleAuthUrl;
  },

  handleGoogleCallback: async (code: string): Promise<LoginResponse> => {
    const response = await api.get<LoginResponse>('/auth/google/callback', {
      params: { code },
    });
    handleAuthSuccess(response.data);
    return response.data;
  },

  loginWithNaver: (): void => {
    const NAVER_CLIENT_ID = import.meta.env.VITE_NAVER_CLIENT_ID;
    const REDIRECT_URI = `${DOMAIN_NAME}/api/v1/auth/naver/callback`;
    const STATE = Math.random().toString(36).substring(2, 15);

    if (!NAVER_CLIENT_ID) {
      throw new Error('Naver Client ID is not configured.');
    }

    sessionStorage.setItem('naver_oauth_state', STATE);

    const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${NAVER_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&state=${STATE}`;
    window.location.href = naverAuthUrl;
  },

  handleNaverCallback: async (code: string, state: string): Promise<LoginResponse> => {
    const savedState = sessionStorage.getItem('naver_oauth_state');
    if (savedState !== state) {
      throw new Error('State value does not match. Please try again.');
    }
    sessionStorage.removeItem('naver_oauth_state');

    const response = await api.get<LoginResponse>('/auth/naver/callback', {
      params: { code, state },
    });
    handleAuthSuccess(response.data);
    return response.data;
  },
};

