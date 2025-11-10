import { useState } from "react";
import { Search } from "lucide-react";
import { ChatListItem } from "../components/ChatListItem";
import { Input } from "../components/ui/input";
import { getAllChats } from "../utils/localStorage";

interface ChatListPageProps {
  onNavigate: (page: string, chatId?: string) => void;
}

export function ChatListPage({ onNavigate }: ChatListPageProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // localStorage에서 실제 채팅 데이터 가져오기
  const chats = getAllChats();

  const filteredChats = chats.filter(chat =>
    chat.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="채팅방 검색"
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
            {...chat}
            onClick={() => onNavigate('chatroom', chat.id)}
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