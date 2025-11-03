import { apiClient } from './client';
import type { Review, ReviewCreateRequest, ApiResponse } from '../../types';

export const reviewApi = {
  // 후기 작성
  createReview: async (data: ReviewCreateRequest): Promise<Review> => {
    const response = await apiClient.post<ApiResponse<Review>>('/api/reviews', data);
    return response.data.data!;
  },

  // 내가 받은 후기 목록
  getReceivedReviews: async (): Promise<Review[]> => {
    const response = await apiClient.get<ApiResponse<Review[]>>('/api/reviews/received');
    return response.data.data!;
  },

  // 내가 작성한 후기 목록
  getWrittenReviews: async (): Promise<Review[]> => {
    const response = await apiClient.get<ApiResponse<Review[]>>('/api/reviews/written');
    return response.data.data!;
  },

  // 특정 유저의 후기 목록
  getUserReviews: async (userId: number): Promise<Review[]> => {
    const response = await apiClient.get<ApiResponse<Review[]>>(`/api/reviews/user/${userId}`);
    return response.data.data!;
  },

  // 평균 평점 조회
  getAverageRating: async (userId: number): Promise<number> => {
    const response = await apiClient.get<ApiResponse<{ averageRating: number }>>(`/api/reviews/user/${userId}/average`);
    return response.data.data!.averageRating;
  },
};
