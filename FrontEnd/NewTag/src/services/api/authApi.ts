import { apiClient } from './client';
import type { LoginRequest, LoginResponse, SignupRequest, User, ApiResponse } from '../../types';
import { STORAGE_KEYS } from '../../constants';

export const authApi = {
  // 회원가입
  signup: async (data: SignupRequest): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<{ success: boolean; message: string }>('/api/v1/signup', data);
    return response.data;
  },

  // 로그인
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/api/v1/login', data);
    const loginData = response.data;

    // 토큰 저장
    if (loginData.success && loginData.token) {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, loginData.token);
    }

    return loginData;
  },

  // 로그아웃
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/api/auth/logout');
    } finally {
      // 로컬 스토리지 정리
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_INFO);
    }
  },

  // 현재 사용자 정보 조회
  getCurrentUser: async (): Promise<User> => {
    // baseURL already includes /api/v1, so avoid duplicating /api
    const response = await apiClient.get<ApiResponse<User>>('/auth/me');
    return response.data.data!;
  },

  // 이메일 중복 확인
  checkEmailDuplicate: async (email: string): Promise<boolean> => {
    const response = await apiClient.get<{ success: boolean; message: string }>(`/api/v1/emailMatch?email=${email}`);
    // success: false면 중복(사용중), true면 사용가능
    return !response.data.success;
  },

  // 닉네임 중복 확인
  checkNickDuplicate: async (nick: string): Promise<boolean> => {
    const response = await apiClient.get<{ success: boolean; message: string }>(`/api/v1/idMatch?nick=${nick}`);
    // success: false면 중복(사용중), true면 사용가능
    return !response.data.success;
  },

  // 소셜 로그인 (Google)
  loginWithGoogle: async (): Promise<LoginResponse> => {
    // OAuth 리다이렉트 처리
    window.location.href = `${apiClient.defaults.baseURL}/oauth2/authorization/google`;
    return Promise.resolve({} as LoginResponse);
  },

  // 소셜 로그인 (Kakao)
  loginWithKakao: async (): Promise<LoginResponse> => {
    window.location.href = `${apiClient.defaults.baseURL}/oauth2/authorization/kakao`;
    return Promise.resolve({} as LoginResponse);
  },

  // 소셜 로그인 (Naver)
  loginWithNaver: async (): Promise<LoginResponse> => {
    window.location.href = `${apiClient.defaults.baseURL}/oauth2/authorization/naver`;
    return Promise.resolve({} as LoginResponse);
  },
};
