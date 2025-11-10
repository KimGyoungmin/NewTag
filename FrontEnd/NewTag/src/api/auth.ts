import { api } from './client';
import type { LoginRequest, LoginResponse, SignupRequest, User, ApiResponse } from '../types';

/**
 * 인증 관련 API
 */
export const authApi = {
  /**
   * 로그인
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/login', credentials);
    return response.data;
  },

  /**
   * 회원가입
   */
  signup: async (userData: SignupRequest): Promise<ApiResponse<User>> => {
    const response = await api.post<ApiResponse<User>>('/signup', userData);
    return response.data;
  },

  /**
   * 이메일 중복 확인
   */
  checkEmailAvailable: async (email: string): Promise<boolean> => {
    const response = await api.get<ApiResponse<boolean>>('/emailMatch', {
      params: { email },
    });
    return response.data.success;
  },

  /**
   * 닉네임 중복 확인
   */
  checkNickAvailable: async (nick: string): Promise<boolean> => {
    const response = await api.get<ApiResponse<boolean>>('/idMatch', {
      params: { nick },
    });
    return response.data.success;
  },

  /**
   * 로그아웃
   */
  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },

  /**
   * 현재 로그인 사용자 정보 가져오기
   */
  getCurrentUser: (): User | null => {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  },

  /**
   * 로그인 상태 확인
   */
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('auth_token');
  },
};
