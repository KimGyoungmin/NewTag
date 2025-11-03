import React from 'react';
import { MessageCircle } from 'lucide-react';

interface Product {
  id: number;
  title: string;
  price: number;
  location: string;
  likes: number;
  emoji: string;
  views: number;
  seller: string;
  sellerId: string;
}

interface ChatMessage {
  sender: string;
  text: string;
  time: string;
}

interface ChatMessages {
  [key: number]: ChatMessage[];
}

interface ChatListPageProps {
  products: Product[];
  chatMessages: ChatMessages;
  setActiveChat: (chat: Product) => void;
  setCurrentScreen: (screen: string) => void;
}

const ChatListPage: React.FC<ChatListPageProps> = ({
  products,
  chatMessages,
  setActiveChat,
  setCurrentScreen
}) => {
  const chats = products.filter(p => chatMessages[p.id]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4">
        <h1 className="text-xl font-bold">채팅</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageCircle className="w-16 h-16 mb-4" />
            <div>진행 중인 채팅이 없습니다</div>
          </div>
        ) : (
          chats.map(chat => {
            const lastMessage = chatMessages[chat.id]?.[chatMessages[chat.id].length - 1];
            return (
              <div
                key={chat.id}
                onClick={() => {
                  setActiveChat(chat);
                  setCurrentScreen('chat');
                }}
                className="flex items-center gap-3 p-4 border-b hover:bg-gray-50 cursor-pointer"
              >
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-2xl">
                  {chat.emoji}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{chat.seller}</div>
                  <div className="text-sm text-gray-500 truncate">{lastMessage?.text}</div>
                </div>
                <div className="text-xs text-gray-400">{lastMessage?.time}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatListPage;
