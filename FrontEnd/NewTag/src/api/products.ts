import { api } from './client';
import type {
  Product,
  ProductCreateRequest,
  ProductUpdateRequest,
  PaginatedResponse,
  ApiResponse,
} from '../types';

/**
 * 상품 관련 API
 */
export const productsApi = {
  /**
   * 상품 목록 조회 (페이지네이션)
   */
  getProducts: async (params?: {
    page?: number;
    size?: number;
    categoryId?: number;
    sortBy?: string;
  }): Promise<any> => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  /**
   * 상품 상세 조회
   */
  getProductById: async (productId: number): Promise<Product> => {
    const response = await api.get<Product>(`/products/${productId}`);
    return response.data;
  },

  /**
   * 상품 등록
   */
  createProduct: async (productData: ProductCreateRequest): Promise<Product> => {
    const formData = new FormData();

    // 상품 정보 추가
    formData.append('title', productData.title);
    formData.append('content', productData.content);
    formData.append('price', productData.price.toString());
    formData.append('categoryId', productData.categoryId.toString());
    formData.append('locationNm', productData.locationNm);
    formData.append('latitude', productData.latitude.toString());
    formData.append('longitude', productData.longitude.toString());

    // 이미지 파일 추가
    productData.images.forEach((image) => {
      formData.append('images', image);
    });

    const response = await api.upload<Product>('/products', formData);
    return response.data;
  },

  /**
   * 상품 수정
   */
  updateProduct: async (productId: number, productData: ProductUpdateRequest): Promise<Product> => {
    const response = await api.put<Product>(`/products/${productId}`, productData);
    return response.data;
  },

  /**
   * 상품 삭제 (소프트 삭제)
   */
  deleteProduct: async (productId: number): Promise<void> => {
    await api.delete(`/products/${productId}`);
  },

  /**
   * 내 상품 목록 조회
   */
  getMyProducts: async (): Promise<Product[]> => {
    const response = await api.get<Product[]>('/products/my');
    return response.data;
  },

  /**
   * 판매자의 상품 목록 조회
   */
  getProductsBySeller: async (sellerId: number): Promise<Product[]> => {
    const response = await api.get<Product[]>(`/products/seller/${sellerId}`);
    return response.data;
  },

  /**
   * 상품 조회수 증가
   */
  incrementViewCount: async (productId: number): Promise<void> => {
    await api.post(`/products/${productId}/view`);
  },

  /**
   * 상품 검색 (검색 로그 자동 저장)
   */
  searchProducts: async (
    keyword: string,
    userId?: number,
    deviceType?: string,
    page: number = 0,
    size: number = 20
  ): Promise<any> => {
    const response = await api.get('/products/search', {
      params: { keyword, userId, deviceType, page, size },
    });
    return response.data;
  },

  /**
   * 인기 검색어 조회
   */
  getPopularKeywords: async (limit: number = 10): Promise<string[]> => {
    const response = await api.get<string[]>('/products/search/popular', {
      params: { limit },
    });
    return response.data;
  },

  /**
   * 최근 검색어 조회
   */
  getRecentKeywords: async (userId: number, limit: number = 10): Promise<string[]> => {
    const response = await api.get<string[]>('/products/search/recent', {
      params: { userId, limit },
    });
    return response.data;
  },

  /**
   * 위치 기반 상품 검색
   */
  getProductsByLocation: async (latitude: number, longitude: number, radius: number): Promise<Product[]> => {
    const response = await api.get<Product[]>('/products/location', {
      params: { latitude, longitude, radius },
    });
    return response.data;
  },
};
