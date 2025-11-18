import { apiClient } from '../services/api/client';
import { Product, PaginatedResponse, ProductStatus } from '../types';

const mapProductDetail = (data: any): Product => ({
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
  seller: data.sellerId
    ? {
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
        sellerGrade: data.sellerGrade || '일반',
      }
    : undefined,
  images: data.images || [],
  isFavorite: data.likedByMe,
  favoriteCount: data.favoriteCount || 0,
});

interface GetProductsParams {
  page?: number;
  size?: number;
  sort?: string;
  categoryId?: number;
}

export const productApi = {
  getAll: async (params: GetProductsParams): Promise<PaginatedResponse<Product>> => {
    try {
      const response = await apiClient.get<PaginatedResponse<Product>>('/products', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch products:', error);
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        currentPage: params.page || 0,
        pageSize: params.size || 20,
      };
    }
  },

  getById: async (id: number, userId?: number): Promise<Product | null> => {
    try {
      const params = userId ? { userId } : {};
      const response = await apiClient.get<any>(`/products/${id}`, { params });
      return mapProductDetail(response.data);
    } catch (error) {
      console.error(`Failed to fetch product ${id}:`, error);
      return null;
    }
  },

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

  updateStatus: async (id: number, status: ProductStatus): Promise<Product | null> => {
    try {
      const response = await apiClient.patch<any>(`/products/${id}/status`, { status });
      return mapProductDetail(response.data);
    } catch (error) {
      console.error(`Failed to update product ${id}:`, error);
      return null;
    }
  },

  delete: async (id: number): Promise<boolean> => {
    try {
      await apiClient.delete(`/products/${id}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete product ${id}:`, error);
      return false;
    }
  },

  getByCategory: async (categoryId: number, params: GetProductsParams): Promise<PaginatedResponse<Product>> => {
    return productApi.getAll({ ...params, categoryId });
  },

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
