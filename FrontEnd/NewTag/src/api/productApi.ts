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
  getById: async (id: number, userId?: number): Promise<Product | null> => {
    try {
      const params = userId ? { userId } : {};
      const response = await apiClient.get<any>(`/products/${id}`, { params });

      // 백엔드 응답을 프론트엔드 타입에 맞게 변환
      const data = response.data;
      console.log('Product detail response:', data);
      console.log('Images from backend:', data.images);
      return {
        id: data.id,
        price: data.price,
        title: data.title,
        content: data.content,
        status: data.status,
        locationNm: data.locationNm,
        latitude: data.latitude,
        longitude: data.longitude,
        viewCount: data.viewCount,
        isDelete: false,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
        sellerId: data.sellerId,
        categoryId: data.categoryId || 0,
        seller: data.sellerId ? {
          id: data.sellerId,
          name: data.sellerName,
          nick: data.sellerNick || '',
          email: '',
          provider: 'LOCAL',
          emailVerified: false,
          phoneVerified: false,
          role: 'USER',
          isDelete: false,
          trust: data.sellerRatingAvg || 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          profileImg: data.sellerProfileImg || '/default-avatar.png',
          sellerRatingAvg: data.sellerRatingAvg || 0,
          sellerRatingCount: data.sellerRatingCount || 0,
          sellerGrade: data.sellerGrade || '새내기',
        } : undefined,
        images: data.images || [],
        isFavorite: data.likedByMe,
        favoriteCount: data.favoriteCount || 0,
      };
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
