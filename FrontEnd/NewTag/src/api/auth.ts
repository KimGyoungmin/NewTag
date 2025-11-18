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
};
