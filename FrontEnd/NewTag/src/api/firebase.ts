import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  QueryConstraint,
} from 'firebase/firestore';
import type { ChatRoom, ChatMessage } from '../types';

/**
 * Firebase 설정
 * .env 파일에서 환경 변수를 가져옵니다
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Firebase 초기화
let app: FirebaseApp;
let db: Firestore;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error;
}

/**
 * 채팅방 관련 API
 */
export const chatRoomsApi = {
  /**
   * 채팅방 생성
   */
  createChatRoom: async (chatRoomData: Omit<ChatRoom, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const chatRoomsRef = collection(db, 'chatRooms');
    const docRef = await addDoc(chatRoomsRef, {
      ...chatRoomData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  /**
   * 채팅방 조회
   */
  getChatRoom: async (chatRoomId: string): Promise<ChatRoom | null> => {
    const chatRoomRef = doc(db, 'chatRooms', chatRoomId);
    const docSnap = await getDoc(chatRoomRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as ChatRoom;
    }
    return null;
  },

  /**
   * 사용자의 채팅방 목록 조회
   */
  getChatRoomsByUser: async (userId: number): Promise<ChatRoom[]> => {
    const chatRoomsRef = collection(db, 'chatRooms');
    const q = query(
      chatRoomsRef,
      where('buyerId', '==', userId),
      orderBy('updatedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ChatRoom[];
  },

  /**
   * 판매자의 채팅방 목록 조회
   */
  getChatRoomsBySeller: async (sellerId: number): Promise<ChatRoom[]> => {
    const chatRoomsRef = collection(db, 'chatRooms');
    const q = query(
      chatRoomsRef,
      where('sellerId', '==', sellerId),
      orderBy('updatedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ChatRoom[];
  },

  /**
   * 상품별 채팅방 조회 (구매자와 판매자 사이)
   */
  getChatRoomByProduct: async (productId: number, buyerId: number, sellerId: number): Promise<ChatRoom | null> => {
    const chatRoomsRef = collection(db, 'chatRooms');
    const q = query(
      chatRoomsRef,
      where('productId', '==', productId),
      where('buyerId', '==', buyerId),
      where('sellerId', '==', sellerId)
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      } as ChatRoom;
    }
    return null;
  },

  /**
   * 채팅방 업데이트
   */
  updateChatRoom: async (chatRoomId: string, data: Partial<ChatRoom>): Promise<void> => {
    const chatRoomRef = doc(db, 'chatRooms', chatRoomId);
    await updateDoc(chatRoomRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * 채팅방 삭제
   */
  deleteChatRoom: async (chatRoomId: string): Promise<void> => {
    const chatRoomRef = doc(db, 'chatRooms', chatRoomId);
    await deleteDoc(chatRoomRef);
  },

  /**
   * 채팅방 실시간 구독
   */
  subscribeToChatRoom: (chatRoomId: string, callback: (chatRoom: ChatRoom) => void) => {
    const chatRoomRef = doc(db, 'chatRooms', chatRoomId);
    return onSnapshot(chatRoomRef, (doc) => {
      if (doc.exists()) {
        callback({
          id: doc.id,
          ...doc.data(),
        } as ChatRoom);
      }
    });
  },

  /**
   * 사용자의 채팅방 목록 실시간 구독
   */
  subscribeToUserChatRooms: (userId: number, callback: (chatRooms: ChatRoom[]) => void) => {
    const chatRoomsRef = collection(db, 'chatRooms');
    const q = query(
      chatRoomsRef,
      where('buyerId', '==', userId),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const chatRooms = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ChatRoom[];
      callback(chatRooms);
    });
  },

  /**
   * 특정 상품의 채팅방 개수 조회
   */
  getChatRoomCountByProduct: async (productId: number): Promise<number> => {
    const chatRoomsRef = collection(db, 'chatRooms');
    const q = query(
      chatRoomsRef,
      where('productId', '==', productId)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  },

  /**
   * 여러 상품의 채팅방 개수를 한 번에 조회 (배치)
   */
  getChatRoomCountsByProducts: async (productIds: number[]): Promise<Map<number, number>> => {
    const chatRoomsRef = collection(db, 'chatRooms');

    // Firestore의 'in' 쿼리는 최대 10개까지만 지원하므로, 필요시 청크로 나눔
    const chunkSize = 10;
    const chunks: number[][] = [];
    for (let i = 0; i < productIds.length; i += chunkSize) {
      chunks.push(productIds.slice(i, i + chunkSize));
    }

    const countMap = new Map<number, number>();

    // 각 청크별로 쿼리 실행
    await Promise.all(
      chunks.map(async (chunk) => {
        const q = query(
          chatRoomsRef,
          where('productId', 'in', chunk)
        );

        const querySnapshot = await getDocs(q);

        // 각 상품별 카운트 집계
        querySnapshot.docs.forEach((doc) => {
          const data = doc.data();
          const productId = data.productId as number;
          countMap.set(productId, (countMap.get(productId) || 0) + 1);
        });
      })
    );

    // 0개인 상품들도 Map에 추가
    productIds.forEach((id) => {
      if (!countMap.has(id)) {
        countMap.set(id, 0);
      }
    });

    return countMap;
  },
};

/**
 * 채팅 메시지 관련 API
 */
export const chatMessagesApi = {
  /**
   * 메시지 전송
   */
  sendMessage: async (messageData: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<string> => {
    const messagesRef = collection(db, 'messages');
    const docRef = await addDoc(messagesRef, {
      ...messageData,
      timestamp: serverTimestamp(),
    });

    // 채팅방의 lastMessage 업데이트
    await chatRoomsApi.updateChatRoom(messageData.chatRoomId, {
      lastMessage: messageData.message,
      lastMessageAt: new Date(),
    } as Partial<ChatRoom>);

    return docRef.id;
  },

  /**
   * 채팅방의 메시지 목록 조회
   */
  getMessages: async (chatRoomId: string, limit: number = 50): Promise<ChatMessage[]> => {
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('chatRoomId', '==', chatRoomId),
      orderBy('timestamp', 'asc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ChatMessage[];
  },

  /**
   * 메시지 읽음 처리
   */
  markAsRead: async (messageId: string): Promise<void> => {
    const messageRef = doc(db, 'messages', messageId);
    await updateDoc(messageRef, {
      isRead: true,
    });
  },

  /**
   * 채팅방의 모든 메시지 읽음 처리
   */
  markAllAsRead: async (chatRoomId: string, userId: number): Promise<void> => {
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('chatRoomId', '==', chatRoomId),
      where('senderId', '!=', userId),
      where('isRead', '==', false)
    );

    const querySnapshot = await getDocs(q);
    const updatePromises = querySnapshot.docs.map((doc) =>
      updateDoc(doc.ref, { isRead: true })
    );

    await Promise.all(updatePromises);
  },

  /**
   * 채팅방의 메시지 실시간 구독
   */
  subscribeToMessages: (chatRoomId: string, callback: (messages: ChatMessage[]) => void) => {
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('chatRoomId', '==', chatRoomId),
      orderBy('timestamp', 'asc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const messages = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ChatMessage[];
      callback(messages);
    });
  },

  /**
   * 메시지 삭제
   */
  deleteMessage: async (messageId: string): Promise<void> => {
    const messageRef = doc(db, 'messages', messageId);
    await deleteDoc(messageRef);
  },
};

export { db };
