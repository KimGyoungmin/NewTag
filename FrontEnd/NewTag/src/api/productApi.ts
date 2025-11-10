import { apiClient } from '../services/api/client';
import { Product, PaginatedResponse } from '../types';

interface GetProductsParams {
  page?: number;
  size?: number;
  sort?: string;
  categoryId?: number;
}

export const productApi = {
  // 상품 전체 조회 (페이지네이션)
  getAll: async (params: GetProductsParams): Promise<PaginatedResponse<Product>> => {
    try {
      const response = await apiClient.get<PaginatedResponse<Product>>('/products', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch products:', error);
      // Fallback to mock data if backend fails
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        currentPage: params.page || 0,
        pageSize: params.size || 20,
      };
    }
  },

  // 상품 ID로 조회
  getById: async (id: number): Promise<Product | null> => {
    try {
      const response = await apiClient.get<Product>(`/products/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch product ${id}:`, error);
      return null;
    }
  },

  // 상품 등록
  create: async (formData: FormData): Promise<Product | null> => {
    try {
      const response = await apiClient.post<Product>('/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to create product:', error);
      return null;
    }
  },

  // 상품 수정
  update: async (id: number, data: Partial<Product>): Promise<Product | null> => {
    try {
      const response = await apiClient.put<Product>(`/products/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Failed to update product ${id}:`, error);
      return null;
    }
  },

  // 상품 삭제 (soft delete)
  delete: async (id: number): Promise<boolean> => {
    try {
      await apiClient.delete(`/products/${id}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete product ${id}:`, error);
      return false;
    }
  },

  // 카테고리별 상품 조회
  getByCategory: async (categoryId: number, params: GetProductsParams): Promise<PaginatedResponse<Product>> => {
    return productApi.getAll({ ...params, categoryId });
  },

  // 검색
  search: async (keyword: string, params: GetProductsParams): Promise<PaginatedResponse<Product>> => {
    try {
      const response = await apiClient.get<PaginatedResponse<Product>>('/products/search', {
        params: { keyword, ...params },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to search products:', error);
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        currentPage: params.page || 0,
        pageSize: params.size || 20,
      };
    }
  },
};
