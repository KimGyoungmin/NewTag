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
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './config';
import type { ChatLocation, ChatMessage, ChatRoom, ReviewNavigationPayload } from '../../types';

export const chatService = {
  // 채팅방 생성 또는 기존 방 반환
  getOrCreateChatRoom: async (
    productId: number,
    seller: { id: number; nick?: string; profileImg?: string },
    buyer: { id: number; nick?: string; profileImg?: string },
    productInfo: { title: string; image: string; price: number }
  ): Promise<string> => {
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

  // 메시지 전송 (텍스트/이미지/위치/리뷰 링크)
  sendMessage: async (
    chatRoomId: string,
    senderId: number,
    senderNick: string,
    senderProfileImg: string,
    message: string,
    options?: {
      messageType?: string;
      imageUrl?: string;
      location?: ChatLocation | null;
      reviewPayload?: ReviewNavigationPayload | null;
    }
  ) => {
    const messageData = {
      chatRoomId,
      senderId,
      senderNick,
      senderProfileImg,
      message,
      createdAt: serverTimestamp(),
      isRead: false,
      ...(options?.messageType ? { messageType: options.messageType } : {}),
      ...(options?.imageUrl ? { imageUrl: options.imageUrl } : {}),
      ...(options?.location ? { location: options.location } : {}),
      ...(options?.reviewPayload ? { reviewPayload: options.reviewPayload } : {}),
    };

    const lastMessageText =
      options?.messageType === 'image'
        ? '사진을 보냈습니다.'
        : options?.messageType === 'location'
          ? options?.location?.address || '위치를 공유했습니다.'
          : message;

    const docRef = await addDoc(collection(db, 'messages'), messageData);

    await updateDoc(doc(db, 'chatRooms', chatRoomId), {
      lastMessage: lastMessageText,
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

    return onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snapshot) => {
        const messages = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            chatRoomId: data.chatRoomId,
            senderId: data.senderId,
            senderNick: data.senderNick,
            senderProfileImg: data.senderProfileImg,
            message: data.message,
            createdAt: data.createdAt?.toDate() || new Date(),
            isRead: data.isRead,
            messageType: data.messageType,
            reviewPayload: data.reviewPayload || null,
            imageUrl: data.imageUrl,
            location: data.location || null,
          } as ChatMessage;
        });
        callback(messages);
      }
    );
  },

  // 사용자 채팅방 목록 구독
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

    let buyerRooms: ChatRoom[] = [];
    let sellerRooms: ChatRoom[] = [];

    const emit = () => {
      const merged = [...buyerRooms, ...sellerRooms];
      callback(merged);
    };

    const unsubscribe1 = onSnapshot(q, (snapshot) => {
      buyerRooms = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
        lastMessageAt: docSnap.data().lastMessageAt?.toDate(),
      })) as ChatRoom[];
      emit();
    });

    const unsubscribe2 = onSnapshot(q2, (snapshot) => {
      sellerRooms = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
        lastMessageAt: docSnap.data().lastMessageAt?.toDate(),
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

    const messagesQuery = query(
      collection(db, 'messages'),
      where('chatRoomId', '==', chatRoomId)
    );
    const messagesSnapshot = await getDocs(messagesQuery);
    messagesSnapshot.forEach((messageDoc) => {
      batch.delete(messageDoc.ref);
    });

    batch.delete(doc(db, 'chatRooms', chatRoomId));

    await batch.commit();
  },

  getBuyerCandidatesForProduct: async (
    productId: number,
    sellerId: number
  ): Promise<
    Array<{
      chatId: string;
      buyerId: number;
      buyerNick?: string;
      buyerProfileImg?: string;
      lastMessage?: string;
      lastMessageAt?: Date | null;
    }>
  > => {
    const q = query(
      collection(db, 'chatRooms'),
      where('productId', '==', productId),
      where('sellerId', '==', sellerId)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as any;
      return {
        chatId: docSnap.id,
        buyerId: data.buyerId,
        buyerNick: data.buyerNick,
        buyerProfileImg: data.buyerProfileImg,
        lastMessage: data.lastMessage,
        lastMessageAt: data.lastMessageAt?.toDate?.() || null,
      };
    });
  },

  sendReviewRequestMessage: async (
    chatRoomId: string,
    sender: { id: number; nick?: string; profileImg?: string },
    payload: ReviewNavigationPayload
  ) => {
    const message = "[거래가 완료되었나요? 아래 버튼을 눌러 리뷰를 작성해주세요]";
    const messageData = {
      chatRoomId,
      senderId: sender.id,
      senderNick: sender.nick,
      senderProfileImg: sender.profileImg,
      message,
      createdAt: serverTimestamp(),
      isRead: false,
      messageType: 'review_link',
      reviewPayload: payload,
    };

    await addDoc(collection(db, 'messages'), messageData);
    await updateDoc(doc(db, 'chatRooms', chatRoomId), {
      lastMessage: message,
      lastMessageAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  getUnreadCount: async (chatRoomId: string, userId: number): Promise<number> => {
    const q = query(
      collection(db, 'messages'),
      where('chatRoomId', '==', chatRoomId),
      where('senderId', '!=', userId),
      where('isRead', '==', false)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  },

  getChatCountByProductId: async (productId: number): Promise<number> => {
    const q = query(
      collection(db, 'chatRooms'),
      where('productId', '==', productId)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  },

  getChatCountsByProductIds: async (productIds: number[]): Promise<Map<number, number>> => {
    const counts = new Map<number, number>();

    const chunkSize = 10;
    for (let i = 0; i < productIds.length; i += chunkSize) {
      const chunk = productIds.slice(i, i + chunkSize);

      const q = query(
        collection(db, 'chatRooms'),
        where('productId', 'in', chunk)
      );

      const snapshot = await getDocs(q);

      snapshot.docs.forEach((docSnap) => {
        const productId = docSnap.data().productId;
        counts.set(productId, (counts.get(productId) || 0) + 1);
      });
    }

    return counts;
  },

  getTotalUnreadCount: async (userId: number): Promise<number> => {
    const chatRoomsQuery1 = query(
      collection(db, 'chatRooms'),
      where('buyerId', '==', userId)
    );
    const chatRoomsQuery2 = query(
      collection(db, 'chatRooms'),
      where('sellerId', '==', userId)
    );

    const [buyerRooms, sellerRooms] = await Promise.all([
      getDocs(chatRoomsQuery1),
      getDocs(chatRoomsQuery2),
    ]);

    const myChatRoomIds = [
      ...buyerRooms.docs.map((docSnap) => docSnap.id),
      ...sellerRooms.docs.map((docSnap) => docSnap.id),
    ];

    let totalUnread = 0;
    for (const roomId of myChatRoomIds) {
      const messagesQuery = query(
        collection(db, 'messages'),
        where('chatRoomId', '==', roomId),
        where('isRead', '==', false)
      );

      const messagesSnapshot = await getDocs(messagesQuery);

      const unreadFromOthers = messagesSnapshot.docs.filter(
        (docSnap) => docSnap.data().senderId !== userId
      ).length;

      totalUnread += unreadFromOthers;
    }

    return totalUnread;
  },

  subscribeToTotalUnreadCount: (
    userId: number,
    callback: (count: number) => void
  ): (() => void) => {
    let myChatRoomIds: string[] = [];
    const unsubscribers: Array<() => void> = [];

    const chatRoomsQuery1 = query(
      collection(db, 'chatRooms'),
      where('buyerId', '==', userId)
    );
    const chatRoomsQuery2 = query(
      collection(db, 'chatRooms'),
      where('sellerId', '==', userId)
    );

    let messageUnsubscribers: Array<() => void> = [];

    const updateChatRooms = () => {
      messageUnsubscribers.forEach((unsub) => unsub());
      messageUnsubscribers = [];

      const unreadCounts = new Map<string, number>();

      if (myChatRoomIds.length === 0) {
        callback(0);
        return;
      }

      myChatRoomIds.forEach((roomId) => {
        const messagesQuery = query(
          collection(db, 'messages'),
          where('chatRoomId', '==', roomId),
          where('isRead', '==', false)
        );

        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
          const unreadFromOthers = snapshot.docs.filter(
            (docSnap) => docSnap.data().senderId !== userId
          ).length;

          unreadCounts.set(roomId, unreadFromOthers);

          const total = Array.from(unreadCounts.values()).reduce((sum, count) => sum + count, 0);
          callback(total);
        });

        messageUnsubscribers.push(unsubscribe);
      });
    };

    const unsubBuyer = onSnapshot(chatRoomsQuery1, (snapshot) => {
      const buyerRoomIds = snapshot.docs.map((docSnap) => docSnap.id);

      onSnapshot(chatRoomsQuery2, (snapshot2) => {
        const sellerRoomIds = snapshot2.docs.map((docSnap) => docSnap.id);
        myChatRoomIds = [...buyerRoomIds, ...sellerRoomIds];
        updateChatRooms();
      });
    });

    unsubscribers.push(unsubBuyer);

    return () => {
      unsubscribers.forEach((unsub) => unsub());
      messageUnsubscribers.forEach((unsub) => unsub());
    };
  },
};
