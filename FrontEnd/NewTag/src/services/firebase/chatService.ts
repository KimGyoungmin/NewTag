import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  getDocs,
  Timestamp,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './config';
import type { ChatMessage, ChatRoom } from '../../types';

export const chatService = {
  // 채팅방 생성 또는 가져오기
  getOrCreateChatRoom: async (
    productId: number,
    seller: { id: number; nick?: string; profileImg?: string },
    buyer: { id: number; nick?: string; profileImg?: string },
    productInfo: { title: string; image: string; price: number }
  ): Promise<string> => {
    // 기존 채팅방 확인
    const q = query(
      collection(db, 'chatRooms'),
      where('productId', '==', productId),
      where('sellerId', '==', seller.id),
      where('buyerId', '==', buyer.id)
    );

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      return snapshot.docs[0].id;
    }

    // 새 채팅방 생성
    const chatRoom = {
      productId,
      productTitle: productInfo.title,
      productImage: productInfo.image,
      productPrice: productInfo.price,
      sellerId: seller.id,
      sellerNick: seller.nick,
      sellerProfileImg: seller.profileImg,
      buyerId: buyer.id,
      buyerNick: buyer.nick,
      buyerProfileImg: buyer.profileImg,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'chatRooms'), chatRoom);
    return docRef.id;
  },

  // 메시지 전송
  sendMessage: async (
    chatRoomId: string,
    senderId: number,
    senderNick: string,
    senderProfileImg: string,
    message: string
  ) => {
    const messageData = {
      chatRoomId,
      senderId,
      senderNick,
      senderProfileImg,
      message,
      createdAt: serverTimestamp(),
      isRead: false,
    };

    const docRef = await addDoc(collection(db, 'messages'), messageData);

    // 채팅방 lastMessage 업데이트
    await updateDoc(doc(db, 'chatRooms', chatRoomId), {
      lastMessage: message,
      lastMessageAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  },

  // 실시간 메시지 구독
  subscribeToMessages: (
    chatRoomId: string,
    callback: (messages: ChatMessage[]) => void
  ) => {
    const q = query(
      collection(db, 'messages'),
      where('chatRoomId', '==', chatRoomId),
      orderBy('createdAt', 'asc')
    );

    // includeMetadataChanges:true로 서버 confirm 후 타임스탬프 반영되도록 보장
    return onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snapshot) => {
        const messages = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            chatRoomId: data.chatRoomId,
            senderId: data.senderId,
            senderNick: data.senderNick,
            senderProfileImg: data.senderProfileImg,
            message: data.message,
            createdAt: data.createdAt?.toDate() || new Date(),
            isRead: data.isRead,
          } as ChatMessage;
        });
        callback(messages);
      }
    );
  },

  // 사용자의 채팅방 목록 구독
  subscribeToChatRooms: (
    userId: number,
    callback: (chatRooms: ChatRoom[]) => void
  ) => {
    const q = query(
      collection(db, 'chatRooms'),
      where('buyerId', '==', userId)
    );

    const q2 = query(
      collection(db, 'chatRooms'),
      where('sellerId', '==', userId)
    );

    // 두 쿼리 결과를 병합해서 전달
    let buyerRooms: ChatRoom[] = [];
    let sellerRooms: ChatRoom[] = [];

    const emit = () => {
      const merged = [...buyerRooms, ...sellerRooms];
      callback(merged);
    };

    const unsubscribe1 = onSnapshot(q, (snapshot) => {
      buyerRooms = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        lastMessageAt: doc.data().lastMessageAt?.toDate(),
      })) as ChatRoom[];
      emit();
    });

    const unsubscribe2 = onSnapshot(q2, (snapshot) => {
      sellerRooms = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        lastMessageAt: doc.data().lastMessageAt?.toDate(),
      })) as ChatRoom[];
      emit();
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  },

  // 메시지 읽음 처리
  markAsRead: async (chatRoomId: string, userId: number) => {
    const q = query(
      collection(db, 'messages'),
      where('chatRoomId', '==', chatRoomId),
      where('senderId', '!=', userId),
      where('isRead', '==', false)
    );

    const snapshot = await getDocs(q);

    const updatePromises = snapshot.docs.map((document) =>
      updateDoc(doc(db, 'messages', document.id), { isRead: true })
    );

    await Promise.all(updatePromises);
  },

  deleteChatRoom: async (chatRoomId: string) => {
    const batch = writeBatch(db);

    // Delete all messages in the room
    const messagesQuery = query(
      collection(db, 'messages'),
      where('chatRoomId', '==', chatRoomId)
    );
    const messagesSnapshot = await getDocs(messagesQuery);
    messagesSnapshot.forEach((messageDoc) => {
      batch.delete(messageDoc.ref);
    });

    // Delete the chat room document
    batch.delete(doc(db, 'chatRooms', chatRoomId));

    await batch.commit();
  },
};
