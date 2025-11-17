import { api } from './client';
import type { LoginRequest, LoginResponse, SignupRequest, User, ApiResponse } from '../types';

const TOKEN_STORAGE_KEY = 'auth_token';
const USER_STORAGE_KEY = 'user';

/**
 * 인증 관련 API
 */
export const authApi = {
  /**
   * 로그인
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/login', credentials);
    const loginData = response.data;

    if (loginData.success && loginData.token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, loginData.token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify({ nick: credentials.nick }));

      // Dispatch custom event to notify Header component
      window.dispatchEvent(new Event('auth-change'));
    }

    return loginData;
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
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);

    // Dispatch custom event to notify Header component
    window.dispatchEvent(new Event('auth-change'));
  },

  /**
   * 현재 로그인 사용자 정보 가져오기
   */
  getCurrentUser: (): User | null => {
    const userJson = localStorage.getItem(USER_STORAGE_KEY);
    return userJson ? JSON.parse(userJson) : null;
  },

  /**
   * 로그인 상태 확인
   */
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(TOKEN_STORAGE_KEY);
  },
};
