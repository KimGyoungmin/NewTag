import { apiClient } from './client';
import type { LoginRequest, LoginResponse, SignupRequest, User, ApiResponse } from '../../types';
import { STORAGE_KEYS } from '../../constants';

export const authApi = {
  // 회원가입
  signup: async (data: SignupRequest): Promise<User> => {
    const response = await apiClient.post<ApiResponse<User>>('/api/auth/signup', data);
    return response.data.data!;
  },

  // 로그인
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/api/auth/login', data);
    const loginData = response.data.data!;

    // 토큰 저장
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, loginData.token);
    localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(loginData.user));

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
    const response = await apiClient.get<ApiResponse<User>>('/api/auth/me');
    return response.data.data!;
  },

  // 이메일 중복 확인
  checkEmailDuplicate: async (email: string): Promise<boolean> => {
    const response = await apiClient.get<ApiResponse<{ isDuplicate: boolean }>>(`/api/auth/check-email?email=${email}`);
    return response.data.data!.isDuplicate;
  },

  // 닉네임 중복 확인
  checkNickDuplicate: async (nick: string): Promise<boolean> => {
    const response = await apiClient.get<ApiResponse<{ isDuplicate: boolean }>>(`/api/auth/check-nick?nick=${nick}`);
    return response.data.data!.isDuplicate;
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
