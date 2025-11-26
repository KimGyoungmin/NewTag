import { API_BASE_URL } from '../../constants';

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

    const response = await fetch(`${API_BASE_URL}/uploads/chat`, {
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
    // data.url은 /api/v1/로 시작하는 상대 경로
    // 백엔드가 http://localhost:8081이라면 전체 URL 반환
    return `http://localhost:8081${data.url}`;
  },
};
