import { apiClient } from '../services/api/client';
import { Review, RatingSummary, PaginatedResponse } from '../types';
import { reviewApi as internalReviewApi } from '../services/api/reviewApi';

interface GetReviewsParams {
  page?: number;
  size?: number;
}

export const reviewApi = {
  // 특정 사용자가 받은 리뷰 목록 조회
  getUserReviews: async (userId: number, params: GetReviewsParams = {}): Promise<PaginatedResponse<Review>> => {
    try {
      const response = await apiClient.get<any>(`/reviews/user/${userId}`, { params });

      return {
        content: response.data.reviews || [],
        totalElements: response.data.totalElements || 0,
        totalPages: response.data.totalPages || 0,
        currentPage: response.data.currentPage || 0,
        pageSize: params.size || 10,
      };
    } catch (error) {
      console.error(`Failed to fetch reviews for user ${userId}:`, error);
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        currentPage: 0,
        pageSize: params.size || 10,
      };
    }
  },

  // 특정 사용자의 평점 요약 정보 조회
  getRatingSummary: async (userId: number): Promise<RatingSummary> => {
    try {
      const response = await apiClient.get<RatingSummary>(`/reviews/user/${userId}/summary`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch rating summary for user ${userId}:`, error);
      return {
        averageRating: 0,
        totalCount: 0,
        rating5Count: 0,
        rating4Count: 0,
        rating3Count: 0,
        rating2Count: 0,
        rating1Count: 0,
      };
    }
  },

  // 특정 거래에 대해 현재 사용자가 이미 리뷰를 작성했는지 확인
  existsReview: async (transactionId: number): Promise<boolean> => {
    try {
      // 내부 공용 API 클라이언트 활용
      return await internalReviewApi.existsReview(transactionId);
    } catch (error) {
      console.error("Failed to check review existence:", error);
      return false;
    }
  },
};
