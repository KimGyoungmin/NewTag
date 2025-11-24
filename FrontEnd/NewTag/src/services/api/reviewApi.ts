import { apiClient } from './client';
import type { Review, ReviewCreateRequest, ApiResponse } from '../../types';

export const reviewApi = {
  // 후기 작성
  createReview: async (data: ReviewCreateRequest): Promise<Review> => {
    const response = await apiClient.post<Review>('/reviews', data);
    return response.data;
  },

  // 내가 받은 후기 목록
  getReceivedReviews: async (): Promise<Review[]> => {
    const response = await apiClient.get<ApiResponse<Review[]>>('/reviews/received');
    return response.data.data!;
  },

  // 내가 작성한 후기 목록
  getWrittenReviews: async (): Promise<Review[]> => {
    const response = await apiClient.get<ApiResponse<Review[]>>('/reviews/written');
    return response.data.data!;
  },

  // 특정 유저의 후기 목록
  getUserReviews: async (userId: number): Promise<Review[]> => {
    const response = await apiClient.get<ApiResponse<Review[]>>(`/reviews/user/${userId}`);
    return response.data.data!;
  },

  // 특정 거래에 대해 현재 사용자가 이미 리뷰를 작성했는지 확인
  existsReview: async (transactionId: number): Promise<boolean> => {
    const response = await apiClient.get<{ exists: boolean }>(`/reviews/exists`, {
      params: { transactionId },
    });
    return response.data.exists;
  },

  // 평균 평점 조회
  getAverageRating: async (userId: number): Promise<number> => {
    const response = await apiClient.get<ApiResponse<{ averageRating: number }>>(`/reviews/user/${userId}/average`);
    return response.data.data!.averageRating;
  },
};
