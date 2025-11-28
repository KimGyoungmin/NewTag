import { api } from './client';
import type { Product } from '../types';

export interface SellerProfileData {
  seller: {
    id: number;
    name: string;
    nick: string;
    profileImg?: string;
    trust?: number;
  };
  reviewSummary: {
    averageRating: number;
    totalCount: number;
    rating5Count: number;
    rating4Count: number;
    rating3Count: number;
    rating2Count: number;
    rating1Count: number;
  };
  products: Product[];
  totalProducts: number;
}

export const sellerApi = {
  getSellerProfile: async (sellerId: number, page: number = 0, size: number = 12): Promise<SellerProfileData | null> => {
    try {
      const response = await api.get(`/sellers/${sellerId}`, { params: { page, size } });
      return response.data?.data as SellerProfileData;
    } catch (error) {
      console.error('Failed to fetch seller profile', error);
      return null;
    }
  },
};

