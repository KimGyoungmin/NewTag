import { api } from './client';

export interface Category {
  id: number;
  categoryNm: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 카테고리 API
 */
export const categoryApi = {
  /**
   * 모든 카테고리 조회
   */
  async getAllCategories(): Promise<Category[]> {
    const response = await api.get<Category[]>('/categories');
    return response.data;
  },

  /**
   * 카테고리 ID로 조회
   */
  async getCategoryById(id: number): Promise<Category> {
    const response = await api.get<Category>(`/categories/${id}`);
    return response.data;
  },

  /**
   * 카테고리 생성
   */
  async createCategory(categoryNm: string): Promise<Category> {
    const response = await api.post<Category>('/categories', { categoryNm });
    return response.data;
  },

  /**
   * 카테고리 수정
   */
  async updateCategory(id: number, categoryNm: string): Promise<Category> {
    const response = await api.put<Category>(`/categories/${id}`, { categoryNm });
    return response.data;
  },

  /**
   * 카테고리 삭제
   */
  async deleteCategory(id: number): Promise<void> {
    await api.delete(`/categories/${id}`);
  },
};
