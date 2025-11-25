import { api } from "./client";
import type { ApiResponse } from "../types";

export interface ProfileUpdateRequest {
  name?: string;
  nickname?: string;
  phone?: string;
  profileImage?: string;
  email?: string;
}

export interface ProfileUpdateResponse extends ApiResponse<any> {
  user?: any;
}

export const userApi = {
  updateProfile: async (payload: ProfileUpdateRequest): Promise<ProfileUpdateResponse> => {
    const body = {
      name: payload.name,
      nick: payload.nickname,
      phone: payload.phone,
      email: payload.email,
      profileImg: payload.profileImage,
    };
    const response = await api.put<ProfileUpdateResponse>("/update", body);
    return response.data;
  },

  uploadProfileImage: async (file: File): Promise<{ success: boolean; path: string; url: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<{ success: boolean; path: string; url: string }>(
      "/uploads/profile",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return response.data;
  },
};
