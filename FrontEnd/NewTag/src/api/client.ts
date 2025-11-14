import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// API Base URL (환경 변수에서 가져오기)
const DEFAULT_SERVER_URL = 'http://localhost:8081';
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || DEFAULT_SERVER_URL;
const normalizedBaseUrl = rawBaseUrl.replace(/\/$/, '');
const API_BASE_URL = normalizedBaseUrl.includes('/api')
  ? normalizedBaseUrl
  : `${normalizedBaseUrl}/api/v1`;

/**
 * Axios 인스턴스 생성
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 쿠키 포함
});

/* 테스트 주석 */

/**
 * 요청 인터셉터 - 인증 토큰 자동 추가
 */
apiClient.interceptors.request.use(
  (config) => {
    // 로컬 스토리지에서 토큰 가져오기
    const token = localStorage.getItem('auth_token');

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log('[API Request]', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

/**
 * 응답 인터셉터 - 에러 핸들링
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('[API Response]', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('[API Response Error]', error.response?.status, error.config?.url);

    // 인증 에러 처리 (401)
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      // 로그인 페이지로 리다이렉트 (필요시)
      // window.location.href = '/login';
    }

    // 권한 에러 처리 (403)
    if (error.response?.status === 403) {
      alert('접근 권한이 없습니다.');
    }

    // 서버 에러 처리 (500)
    if (error.response?.status === 500) {
      alert('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }

    return Promise.reject(error);
  }
);

/**
 * API 헬퍼 함수들
 */
export const api = {
  /**
   * GET 요청
   */
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.get<T>(url, config);
  },

  /**
   * POST 요청
   */
  post: <T = any, D = any>(url: string, data?: D, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.post<T>(url, data, config);
  },

  /**
   * PUT 요청
   */
  put: <T = any, D = any>(url: string, data?: D, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.put<T>(url, data, config);
  },

  /**
   * PATCH 요청
   */
  patch: <T = any, D = any>(url: string, data?: D, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.patch<T>(url, data, config);
  },

  /**
   * DELETE 요청
   */
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.delete<T>(url, config);
  },

  /**
   * 파일 업로드 (FormData)
   */
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
