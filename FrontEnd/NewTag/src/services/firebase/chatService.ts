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
import type { ChatMessage, ChatRoom, ReviewNavigationPayload } from '../../types';

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
            messageType: data.messageType,
            reviewPayload: data.reviewPayload || null,
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
    const message = "[시스템] 거래가 완료되었습니다. 아래 버튼을 눌러 리뷰를 작성해 주세요.";
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

  // 안읽은 메시지 개수 조회
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

  // 특정 상품의 채팅방 개수 조회
  getChatCountByProductId: async (productId: number): Promise<number> => {
    const q = query(
      collection(db, 'chatRooms'),
      where('productId', '==', productId)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  },

  // 여러 상품의 채팅방 개수 일괄 조회
  getChatCountsByProductIds: async (productIds: number[]): Promise<Map<number, number>> => {
    const counts = new Map<number, number>();

    // productIds를 10개씩 나눠서 처리 (Firebase IN 쿼리 제한)
    const chunkSize = 10;
    for (let i = 0; i < productIds.length; i += chunkSize) {
      const chunk = productIds.slice(i, i + chunkSize);

      const q = query(
        collection(db, 'chatRooms'),
        where('productId', 'in', chunk)
      );

      const snapshot = await getDocs(q);

      snapshot.docs.forEach(doc => {
        const productId = doc.data().productId;
        counts.set(productId, (counts.get(productId) || 0) + 1);
      });
    }

    return counts;
  },

  // 사용자의 전체 안읽은 메시지 개수 조회 (인덱스 불필요)
  getTotalUnreadCount: async (userId: number): Promise<number> => {
    console.log('[chatService] getTotalUnreadCount called for userId:', userId);

    // 1. 내가 참여한 채팅방 목록 가져오기
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
      getDocs(chatRoomsQuery2)
    ]);

    console.log('[chatService] My chat rooms - buyer:', buyerRooms.size, 'seller:', sellerRooms.size);

    const myChatRoomIds = [
      ...buyerRooms.docs.map(doc => doc.id),
      ...sellerRooms.docs.map(doc => doc.id)
    ];

    // 2. 각 채팅방의 안읽은 메시지 개수를 조회하고 합산
    let totalUnread = 0;
    for (const roomId of myChatRoomIds) {
      const messagesQuery = query(
        collection(db, 'messages'),
        where('chatRoomId', '==', roomId),
        where('isRead', '==', false)
      );

      const messagesSnapshot = await getDocs(messagesQuery);

      // 내가 보낸 메시지는 제외
      const unreadFromOthers = messagesSnapshot.docs.filter(
        doc => doc.data().senderId !== userId
      ).length;

      totalUnread += unreadFromOthers;
    }

    console.log('[chatService] Total unread messages:', totalUnread);
    return totalUnread;
  },

  // 사용자의 전체 안읽은 메시지 개수 실시간 구독
  subscribeToTotalUnreadCount: (
    userId: number,
    callback: (count: number) => void
  ): (() => void) => {
    console.log('[chatService] subscribeToTotalUnreadCount started for userId:', userId);

    let myChatRoomIds: string[] = [];
    const unsubscribers: Array<() => void> = [];

    // 1. 내 채팅방 목록 실시간 구독
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
      // 기존 메시지 구독 해제
      messageUnsubscribers.forEach(unsub => unsub());
      messageUnsubscribers = [];

      // 각 채팅방의 안읽은 메시지 실시간 구독
      const unreadCounts = new Map<string, number>();

      if (myChatRoomIds.length === 0) {
        callback(0);
        return;
      }

      myChatRoomIds.forEach(roomId => {
        const messagesQuery = query(
          collection(db, 'messages'),
          where('chatRoomId', '==', roomId),
          where('isRead', '==', false)
        );

        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
          // 내가 보낸 메시지는 제외
          const unreadFromOthers = snapshot.docs.filter(
            doc => doc.data().senderId !== userId
          ).length;

          unreadCounts.set(roomId, unreadFromOthers);

          // 전체 합산
          const total = Array.from(unreadCounts.values()).reduce((sum, count) => sum + count, 0);
          console.log('[chatService] Real-time unread count updated:', total);
          callback(total);
        });

        messageUnsubscribers.push(unsubscribe);
      });
    };

    // 채팅방 목록 구독 (buyer)
    const unsubBuyer = onSnapshot(chatRoomsQuery1, (snapshot) => {
      const buyerRoomIds = snapshot.docs.map(doc => doc.id);

      onSnapshot(chatRoomsQuery2, (snapshot2) => {
        const sellerRoomIds = snapshot2.docs.map(doc => doc.id);
        myChatRoomIds = [...buyerRoomIds, ...sellerRoomIds];

        console.log('[chatService] Chat rooms updated:', myChatRoomIds.length);
        updateChatRooms();
      });
    });

    unsubscribers.push(unsubBuyer);

    // 모든 구독 해제 함수 반환
    return () => {
      console.log('[chatService] Unsubscribing from unread count');
      unsubscribers.forEach(unsub => unsub());
      messageUnsubscribers.forEach(unsub => unsub());
    };
  },
};
