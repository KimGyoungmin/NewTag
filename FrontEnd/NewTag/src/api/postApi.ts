import { api } from './client';

interface ImageRequest {
  path: string;
  isMain?: boolean;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  price: number;
  categoryId: number;
  locationNm: string;
  latitude: number;
  longitude: number;
  images: ImageRequest[];
  isResell: boolean;
}

// Backend의 ProductDtos.DetailResponse와 완전히 일치
export interface ProductDetailResponse {
  id: number;
  title: string;
  price: number;
  content: string;
  status: string;
  locationNm: string;
  latitude: number;
  longitude: number;
  viewCount: number;
  favoriteCount: number;
  timeAgo: string;
  createdAt: string;
  categoryId: number;
  images: Array<{
    id: number;
    pImg: string;
    isMain: boolean;
    createdAt: string;
    updatedAt: string;
    productId: number;
  }>;
  mainImage: string;
  sellerId: number;
  sellerName: string;
  sellerNick: string;
  sellerProfileImg: string;
  sellerRatingAvg: number;
  sellerRatingCount: number;
  sellerGrade: string;
  likedByMe: boolean;
  isResell: boolean;
}

export interface UploadImageResponse {
  success: boolean;
  path: string;
  url: string;
}

export interface AutoWriteResponse {
  title?: string;
  content?: string;
  price?: number;
  categoryId?: number;
  categoryName?: string;
  sourceImage?: string;
}

export const postApi = {
  create: async (payload: CreatePostRequest): Promise<ProductDetailResponse> => {
    const response = await api.post<ProductDetailResponse>('/products', payload);
    return response.data;
  },

  delete: async (postId: number): Promise<void> => {
    await api.delete(`/products/${postId}`);
  },

  uploadImage: async (file: File): Promise<UploadImageResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<UploadImageResponse>('/uploads/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }); 
    return response.data;
  },

  autoWrite: async (imagePaths: string[]): Promise<AutoWriteResponse> => {
    const response = await api.post<AutoWriteResponse>('/ai/auto-listing', { imagePaths });
    return response.data;
  },
};
