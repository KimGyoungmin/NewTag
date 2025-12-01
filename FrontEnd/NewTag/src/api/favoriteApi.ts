import { api } from './client';

/**
 * 찜하기 API 응답 타입
 */
interface FavoriteResponse {
  success: boolean;
  isFavorited: boolean;
  favoriteCount: number;
  message?: string;
}

interface FavoriteProductsResponse {
  success: boolean;
  productIds: number[];
}

/**
 * 찜하기 관련 API
 */
export const favoriteApi = {
  /**
   * 찜하기 토글 (찜 추가/취소)
   */
  toggleFavorite: async (productId: number, userId: number): Promise<FavoriteResponse> => {
    const response = await api.post<FavoriteResponse>(
      `/favorites/${productId}?userId=${userId}`
    );
    return response.data;
  },

  /**
   * 특정 상품의 찜 상태 확인
   */
  getFavoriteStatus: async (productId: number, userId: number): Promise<FavoriteResponse> => {
    const response = await api.get<FavoriteResponse>(
      `/favorites/${productId}/status?userId=${userId}`
    );
    return response.data;
  },

  /**
   * 사용자가 찜한 상품 ID 목록 조회
   */
  getMyFavoriteProducts: async (userId: number): Promise<number[]> => {
    const response = await api.get<FavoriteProductsResponse>(
      `/favorites/my-products?userId=${userId}`
    );
    return response.data.productIds;
  },
};
