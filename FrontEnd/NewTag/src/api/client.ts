import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { tokenManager } from './tokenManager';

const DEFAULT_SERVER_URL = 'http://localhost:8081/';
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || DEFAULT_SERVER_URL;
const normalizedBaseUrl = rawBaseUrl.replace(/\/$/, '');
export const API_BASE_URL = normalizedBaseUrl.includes('/api')
  ? normalizedBaseUrl
  : `${normalizedBaseUrl}/api/v1`;

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let refreshPromise: Promise<string | null> | null = null;
type RetryConfig = AxiosRequestConfig & { _retry?: boolean };

const refreshAccessToken = async (): Promise<string | null> => {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post('/auth/refresh')
      .then((response) => {
        const { token } = response.data || {};
        if (token) {
          // Access Token만 갱신 (auth-change 이벤트 발생시키지 않음)
          console.log('[API] Token refreshed successfully');
          tokenManager.setAccessToken(token);
          return token as string;
        }
        console.warn('[API] No token in refresh response');
        tokenManager.clearSession();
        return null;
      })
      .catch((error) => {
        console.error('[API] Failed to refresh token', error);
        tokenManager.clearSession();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

apiClient.interceptors.request.use(
  (config) => {
    const token = tokenManager.getAccessToken();
    console.log('[API Client] Request interceptor - URL:', config.url);
    console.log('[API Client] Token from tokenManager:', token ? `${token.substring(0, 20)}...` : 'null');

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API Client] Authorization header set');
    } else {
      console.log('[API Client] No token or no headers - Authorization not set');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const originalRequest = error.config as RetryConfig | undefined;
    const requestUrl = originalRequest?.url ?? '';
    const isAuthEndpoint = requestUrl.includes('/auth/refresh') || requestUrl.includes('/login');

    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      }
    }

    if (status === 401) {
      tokenManager.clearSession();
    }

    return Promise.reject(error);
  }
);

export const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.get<T>(url, config);
  },
  post: <T = any, D = any>(url: string, data?: D, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.post<T>(url, data, config);
  },
  put: <T = any, D = any>(url: string, data?: D, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.put<T>(url, data, config);
  },
  patch: <T = any, D = any>(url: string, data?: D, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.patch<T>(url, data, config);
  },
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.delete<T>(url, config);
  },
  upload: <T = any>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.post<T>(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
    });
  },
};

export default apiClient;
