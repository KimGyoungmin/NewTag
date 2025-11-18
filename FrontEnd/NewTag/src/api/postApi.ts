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

export interface PostSimpleResponse {
  id: number;
  title: string;
  price: number;
  status: string;
  mainImage?: string;
  createdAt?: string;
}

export interface UploadImageResponse {
  success: boolean;
  path: string;
  url: string;
}

export const postApi = {
  create: async (payload: CreatePostRequest): Promise<PostSimpleResponse> => {
    const response = await api.post<PostSimpleResponse>('/products', payload);
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
};
