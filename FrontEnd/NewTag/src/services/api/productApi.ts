import { apiClient } from './client';
import type { Product, ProductCreateRequest, ProductUpdateRequest, ApiResponse, PaginatedResponse } from '../../types';

export const productApi = {
  // 상품 목록 조회
  getProducts: async (params?: {
    page?: number;
    size?: number;
    categoryId?: number;
    status?: string;
  }): Promise<PaginatedResponse<Product>> => {
    const response = await apiClient.get<PaginatedResponse<Product>>('/api/products', { params });
    return response.data;
  },

  // 상품 상세 조회
  getProductById: async (id: number): Promise<Product> => {
    const response = await apiClient.get<ApiResponse<Product>>(`/api/products/${id}`);
    return response.data.data!;
  },

  // 상품 등록
  createProduct: async (data: ProductCreateRequest): Promise<Product> => {
    const formData = new FormData();

    formData.append('title', data.title);
    formData.append('content', data.content);
    formData.append('price', String(data.price));
    formData.append('categoryId', String(data.categoryId));
    formData.append('locationNm', data.locationNm);
    formData.append('latitude', String(data.latitude));
    formData.append('longitude', String(data.longitude));

    data.images.forEach((file) => {
      formData.append('images', file);
    });

    const response = await apiClient.post<ApiResponse<Product>>('/api/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data!;
  },

  // 상품 수정
  updateProduct: async (id: number, data: ProductUpdateRequest): Promise<Product> => {
    const response = await apiClient.put<ApiResponse<Product>>(`/api/products/${id}`, data);
    return response.data.data!;
  },

  // 상품 삭제
  deleteProduct: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/products/${id}`);
  },

  // 찜하기/취소
  toggleFavorite: async (productId: number): Promise<{ isFavorite: boolean }> => {
    const response = await apiClient.post<ApiResponse<{ isFavorite: boolean }>>(`/api/products/${productId}/favorite`);
    return response.data.data!;
  },

  // 찜 목록 조회
  getFavorites: async (): Promise<Product[]> => {
    const response = await apiClient.get<ApiResponse<Product[]>>('/api/products/favorites');
    return response.data.data!;
  },

  // 조회수 증가
  incrementViewCount: async (id: number): Promise<void> => {
    await apiClient.post(`/api/products/${id}/view`);
  },
};
