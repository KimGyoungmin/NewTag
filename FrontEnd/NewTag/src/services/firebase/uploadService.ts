import { API_BASE_URL as RAW_API_BASE_URL } from '../../api/client';

const API_ROOT = RAW_API_BASE_URL.replace(/\/api(\/v\d+)?$/, '');

export const uploadService = {
  uploadChatImage: async (chatRoomId: string, file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    if (chatRoomId) {
      formData.append('chatRoomId', chatRoomId);
    }

    const token = localStorage.getItem('access_token');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${RAW_API_BASE_URL}/uploads/chat`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '이미지 업로드에 실패했습니다');
    }

    const data = await response.json();
    const resolvedUrl = data?.url?.startsWith('/')
      ? `${API_ROOT}${data.url}`
      : `${API_ROOT}/${data?.url ?? ''}`;
    return resolvedUrl;
  },
};
