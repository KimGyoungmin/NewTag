// import { apiClient } from './client';

// // --- DTO 타입 정의 (개선 및 추가) ---
// // MyPageResponse: 필드명을 컴포넌트의 useMemo와 동기화
// export interface MyPageResponse {
//   userNickname: string;
//   profileImageUrl: string;
//   totalSales: number;
//   totalReviews: number;
//   productsCount: number;
//   // 컴포넌트에서 사용하는 필드를 추가 (실제 API 응답에 따라 수정 필요)
//   mannerTemperature: number;
//   grade: string;
//   location: string; // 지역 정보 추가 가정
//   soldCount: number; // 판매 건수 추가 가정
// }

// interface ReviewItem { /* ... */ } // 기존 유지

// // ServerReviewItem: 받은 후기 목록 항목 DTO (컴포넌트의 ServerReviewItem과 동기화)
// export interface ServerReviewItem {
//   reviewId: number;
//   reviewerNick: string;
//   ratingScore: number | null;
//   createdAt: string;
//   content: string;
//   // productId: number; // 상품 정보 연동을 위해 필요할 수 있음
// }

// // ProductListItem: 판매 상품 목록 항목 DTO (컴포넌트의 ServerProduct와 동기화)
// export type ProductStatus = 'ON_SELL' | 'RESERVED' | 'COMPLETED';
// export interface ProductListItem {
//   id: number;
//   title: string;
//   price: number;
//   status: ProductStatus;
//   createdAt: string;
//   locationNm: string;
//   images: string | null; // 단일 이미지 URL 또는 배열 첫 번째
//   mainImage: string | null; // 미리보기용 단일 이미지
//   isDelete: boolean;
//   // 기타 필드...
// }

// // Transaction History DTOs (컴포넌트의 타입과 동기화)
// export interface TransactionItem {
//   transactionId: number;
//   title: string;
//   price: number;
//   transactionDate: string;
//   isBuyer: boolean;
//   status: 'COMPLETED' | 'CANCELLED' | 'IN_PROGRESS';
//   partnerNick: string;
// }
// export interface TransactionHistoryResponse {
//   totalTransactions: number;
//   monthlyHistory: { [year: string]: number };
//   transactions: TransactionItem[];
// }
// export interface UserListItem { // 차단/신고 내역용
//   userId: number;
//   nickname: string;
//   // ...
// }
// export interface ProfileUpdateRequest {
//   nickName: string;
//   profileImageUrl: string;
// }

// // 상품 상태 변경 요청 DTO
// interface UpdateProductStatusRequest {
//   status: ProductStatus;
// }


// // --- API 함수 정의 ---
// export const myPageApi = {
//   // GET /api/user/mypage
//   fetchMyPageData: async (): Promise<MyPageResponse> => {
//     const response = await apiClient.get<MyPageResponse>('/api/user/mypage');
//     return response.data;
//   },

//   // GET /api/user/reviews/received (컴포넌트에서 사용하는 이름으로 변경)
//   fetchReceivedReviews: async (): Promise<ServerReviewItem[]> => {
//     const response = await apiClient.get<ServerReviewItem[]>('/api/user/reviews/received');
//     return response.data;
//   },

//   // GET /api/user/products/sold (컴포넌트에서 사용하는 이름으로 변경)
//   fetchMySoldProducts: async (): Promise<ProductListItem[]> => {
//     const response = await apiClient.get<ProductListItem[]>('/api/user/products/sold');
//     return response.data;
//   },

//   // PATCH /api/user/profile
//   updateProfile: async (request: ProfileUpdateRequest): Promise<void> => {
//     await apiClient.patch('/api/user/profile', request);
//   },

//   // GET /api/user/transactions/history
//   fetchTransactionHistory: async (): Promise<TransactionHistoryResponse> => {
//     const response = await apiClient.get<TransactionHistoryResponse>('/api/user/transactions/history');
//     return response.data;
//   },

//   // GET /api/user/blocks
//   fetchBlockedUsers: async (): Promise<UserListItem[]> => {
//     const response = await apiClient.get<UserListItem[]>('/api/user/blocks');
//     return response.data;
//   },

//   // GET /api/user/reports/mine (컴포넌트에서 사용하는 이름으로 변경)
//   fetchMyReportHistory: async (): Promise<any> => { // 신고 내역 DTO가 없으므로 any 유지
//     const response = await apiClient.get('/api/user/reports/mine');
//     return response.data;
//   },
  
//   // GET /api/user/favorites 💡추가
//   fetchFavorites: async (): Promise<number[]> => { // 상품 ID 배열을 반환한다고 가정
//     // 실제로는 상품 객체 목록일 수 있으나, 현재 컴포넌트의 favoriteIds 상태에 맞춤
//     const response = await apiClient.get<number[]>('/api/user/favorites');
//     return response.data;
//   },

//   // PATCH /api/user/products/{productId}/status 💡추가
//   updateProductStatus: async (productId: number, status: ProductStatus): Promise<void> => {
//     await apiClient.patch(`/api/user/products/${productId}/status`, { status } as UpdateProductStatusRequest);
//   },
  
//   // DELETE /api/user/products/{productId} (논리적 삭제) 💡추가
//   deleteProduct: async (productId: number): Promise<void> => {
//     await apiClient.delete(`/api/user/products/${productId}`);
//   },
// };