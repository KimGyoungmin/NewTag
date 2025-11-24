import { api } from './client';

export interface Address {
  id: number;
  locationNm: string;
  latitude: number;
  longitude: number;
  isDefault?: boolean;
}

export interface AddAddressRequest {
  locationNm: string;
  latitude: number;
  longitude: number;
  isDefault?: boolean;
}

/**
 * 주소 API
 */
export const addressApi = {
  /**
   * 내 주소 목록 조회
   */
  async getMyAddresses(): Promise<Address[]> {
    const response = await api.get<Address[]>('/addresses');
    return response.data;
  },

  /**
   * 기본 주소 조회
   */
  async getDefaultAddress(): Promise<Address | null> {
    try {
      const response = await api.get<Address>('/addresses/default');
      return response.data;
    } catch (error: any) {
      // 204 No Content (기본 주소 없음)
      if (error.response?.status === 204) {
        return null;
      }
      throw error;
    }
  },

  /**
   * 새 주소 추가
   */
  async addAddress(data: AddAddressRequest): Promise<Address> {
    const response = await api.post<Address>('/addresses', data);
    return response.data;
  },

  /**
   * 주소 수정
   */
  async updateAddress(addressId: number, data: AddAddressRequest): Promise<Address> {
    const response = await api.put<Address>(`/addresses/${addressId}`, data);
    return response.data;
  },

  /**
   * 주소 삭제
   */
  async deleteAddress(addressId: number): Promise<void> {
    await api.delete(`/addresses/${addressId}`);
  },

  /**
   * 기본 주소로 설정
   */
  async setDefaultAddress(addressId: number): Promise<Address> {
    const response = await api.put<Address>(`/addresses/${addressId}/default`);
    return response.data;
  },
};
