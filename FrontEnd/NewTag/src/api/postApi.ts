import { api, apiClient } from './client';

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
    thumbnailPath?: string;
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
  category?: string;
  forbiddenItem?: string;
  listing?: {
    forbiddenItem?: string;
    forbidden_item?: string;
    [key: string]: unknown;
  };
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
    // 파일 타입 검증
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff'];
    const allowedExtensions = ['.jpg', '.jpeg', '.jfif', '.png', '.gif', '.webp', '.bmp', '.tiff', '.tif'];

    if (!allowedTypes.includes(file.type)) {
      const fileName = file.name.toLowerCase();
      const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));

      if (!hasValidExtension) {
        throw new Error('지원하지 않는 이미지 형식입니다.\n(jpg, jpeg, png, gif, webp, bmp, tiff만 지원)');
      }
    }

    // 파일 크기 검증 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('이미지 크기는 10MB 이하만 업로드 가능합니다.');
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post<UploadImageResponse>('/uploads/images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      // 백엔드 에러 메시지 추출
      const backendMessage = error?.response?.data?.message || error?.response?.data?.error;
      if (backendMessage) {
        throw new Error(backendMessage);
      }
      throw error;
    }
  },

  autoWrite: async (imagePaths: string[]): Promise<AutoWriteResponse> => {
    // This endpoint goes to the model server, which is routed via /model/* by Caddy.
    // We use the base `apiClient` from './client' to call this path directly, bypassing the /api/v1 prefix.
    const response = await apiClient.post<AutoWriteResponse>('/model/auto-listing', { image_paths: imagePaths });
    return response.data;
  },
};
