// src/api/mypage.ts

// 'api' 객체는 토큰 인증 및 401 재시도 로직이 적용된 Axios 래퍼입니다.
import { apiClient } from "./client"; 
import { ProductStatus } from "../utils/localStorage"; 

// --- 타입 정의 (이전과 동일하게 유지) ---

export type IProductStatus = 'SELLING' | 'RESERVED' | 'SOLD'; 

export interface Product {
    id: string;
    image: string;
    title: string;
    price: number;
    location: string;
    likes: number;
    chatCount: number;
    status: IProductStatus;
    createdAt: string; 
}

export interface UserProfileData {
    id: string;
    name: string;
    image: string;
    rating: number;
    reviewCount: number;
    location: string;
}

export interface PurchaseItem {
    id: string;
    image: string;
    title: string;
    price: number;
    purchaseDate: string; 
}

export interface Review {
    id: string;
    reviewer: string;
    reviewerImage: string;
    rating: number;
    comment: string;
    productTitle: string;
    date: string; 
}

// --- API 함수 정의 (실제 통신 적용) ---

export const mypageApi = {
    /**
     * 사용자 프로필 정보를 가져옵니다.
     * GET /api/v1/mypage/profile
     */
    getProfile: async (): Promise<UserProfileData> => {
        const response = await apiClient.get<UserProfileData>('/mypage/profile');
        return response.data;
    },

    /**
     * 프로필 정보를 업데이트합니다.
     * PUT /api/v1/mypage/profile
     */
    updateProfile: async (profile: Partial<UserProfileData>): Promise<UserProfileData> => {
        // 프로필 ID, 이름, 이미지, 위치 등 변경 가능한 데이터만 전송
        const response = await apiClient.put<UserProfileData>('/mypage/profile', profile);
        return response.data;
    },

    /**
     * 내가 등록한 판매 상품 목록을 가져옵니다.
     * GET /api/v1/mypage/products
     */
    getRegisteredProducts: async (): Promise<Product[]> => {
        const response = await apiClient.get<Product[]>('/mypage/products');
        return response.data;
    },

    /**
     * 관심 목록(찜)에 등록된 상품 목록을 가져옵니다.
     * GET /api/v1/mypage/favorites
     */
    getFavorites: async (): Promise<Product[]> => {
        const response = await apiClient.get<Product[]>('/mypage/favorites');
        return response.data;
    },

    /**
     * 구매 내역 목록을 가져옵니다.
     * GET /api/v1/mypage/purchases
     */
    getPurchaseHistory: async (): Promise<PurchaseItem[]> => {
        const response = await apiClient.get<PurchaseItem[]>('/mypage/purchases');
        return response.data;
    },

    /**
     * 받은 후기 목록을 가져옵니다.
     * GET /api/v1/mypage/reviews/received
     */
    getReviews: async (): Promise<Review[]> => {
        const response = await apiClient.get<Review[]>('/mypage/reviews/received');
        return response.data;
    },

    /**
     * 특정 상품의 상태를 업데이트합니다.
     * PUT /api/v1/mypage/products/{id}/status
     */
    updateProductStatus: async (productId: string, newStatus: ProductStatus): Promise<void> => {
        await apiClient.put(`/mypage/products/${productId}/status`, { status: newStatus });
        // 서버에서 200/204 응답을 기대합니다.
    },

    /**
     * 특정 상품을 삭제합니다.
     * DELETE /api/v1/mypage/products/{id}
     */
    deleteProduct: async (productId: string): Promise<void> => {
        await apiClient.delete(`/mypage/products/${productId}`);
        // 서버에서 200/204 응답을 기대합니다.
    },
    
};
