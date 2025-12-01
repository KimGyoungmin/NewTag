import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ChatListItem } from "../components/ChatListItem";
import { Input } from "../components/ui/input";
import { chatService } from "../services/firebase/chatService";
import { authApi } from "../api/auth";
import type { AuthUser, ChatRoom } from "../types";

interface ChatListPageProps {
  onNavigate: (page: string, chatId?: string) => void;
}

export function ChatListPage({ onNavigate }: ChatListPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const subscribe = () => {
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }

      const me = authApi.getCurrentUser();
      setCurrentUser(me);

      if (!me) {
        setRooms([]);
        return;
      }

      unsubscribe = chatService.subscribeToChatRooms(me.id, async (list) => {
        setRooms(list);

        // 각 채팅방의 안읽은 메시지 개수 조회
        const counts: Record<string, number> = {};
        await Promise.all(
          list.map(async (room) => {
            const count = await chatService.getUnreadCount(room.id, me.id);
            counts[room.id] = count;
          })
        );
        setUnreadCounts(counts);
      });
    };

    subscribe();
    window.addEventListener("auth-change", subscribe);

    return () => {
      if (unsubscribe) unsubscribe();
      window.removeEventListener("auth-change", subscribe);
    };
  }, []);

  const items = useMemo(() => {
    if (!currentUser) return [] as Array<{
      id: string;
      userName: string;
      userImage: string;
      productImage: string;
      lastMessage: string;
      lastMessageTime: string;
      unreadCount: number;
      lastMessageDate: Date | null;
    }>;

    const mapped = rooms.map((room) => {
      const isSeller = currentUser.id === room.sellerId;
      const peerNick = isSeller ? room.buyerNick : room.sellerNick;
      const peerImg = isSeller ? room.buyerProfileImg : room.sellerProfileImg;
      const lastAt = room.lastMessageAt ? formatRelativeTime(room.lastMessageAt) : "";
      return {
        id: room.id,
        userName: peerNick || "",
        userImage: peerImg || "",
        productImage: room.productImage,
        lastMessage: room.lastMessage || "",
        lastMessageTime: lastAt,
        unreadCount: unreadCounts[room.id] || 0,
        lastMessageDate: room.lastMessageAt || null,
      };
    });

    // 안읽은 메시지가 있는 채팅을 먼저, 그 다음 최신 메시지 순으로 정렬
    return mapped.sort((a, b) => {
      // 안읽은 메시지가 있는 채팅을 위로
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1;

      // 최신 메시지 순으로 정렬
      const dateA = a.lastMessageDate?.getTime() || 0;
      const dateB = b.lastMessageDate?.getTime() || 0;
      return dateB - dateA;
    });
  }, [rooms, currentUser, unreadCounts]);

  const filteredChats = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter((chat) =>
      chat.userName.toLowerCase().includes(q) ||
      chat.lastMessage.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  function formatRelativeTime(date: Date): string {
    const now = Date.now();
    const diff = Math.max(0, now - date.getTime());
    const m = Math.floor(diff / 60000);
    if (m < 1) return "방금 전";
    if (m < 60) return `${m}분 전`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}시간 전`;
    const d = Math.floor(h / 24);
    return `${d}일 전`;
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="채팅 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-secondary border-0"
            />
          </div>
        </div>
      </div>

      {/* Chat List */}
      <div className="container mx-auto">
        {filteredChats.map((chat) => (
          <ChatListItem
            key={chat.id}
            id={chat.id}
            userName={chat.userName}
            userImage={chat.userImage}
            productImage={chat.productImage}
            lastMessage={chat.lastMessage}
            lastMessageTime={chat.lastMessageTime}
            unreadCount={chat.unreadCount}
            onClick={() => onNavigate("chatroom", chat.id)}
          />
        ))}
      </div>

      {filteredChats.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-muted-foreground">검색 결과가 없습니다</p>
        </div>
      )}
    </div>
  );
}
