import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './config';

export const uploadService = {
  uploadChatImage: async (chatRoomId: string, file: File): Promise<string> => {
    const safeName = file.name?.replace(/\s+/g, '_') || 'image';
    const path = `chat/${chatRoomId}/${Date.now()}_${safeName}`;
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  },
};
