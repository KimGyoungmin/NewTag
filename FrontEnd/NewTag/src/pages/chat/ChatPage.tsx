import React, { useState } from 'react';
import { ChevronLeft, Send } from 'lucide-react';

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

interface ChatPageProps {
  activeChat: Product | null;
  messages: ChatMessage[];
  sendMessage: (text: string) => void;
  setCurrentScreen: (screen: string) => void;
  setReviewTarget: (target: { productTitle: string; sellerName: string; productId: number }) => void;
}

const ChatPage: React.FC<ChatPageProps> = ({
  activeChat,
  messages,
  sendMessage,
  setCurrentScreen,
  setReviewTarget
}) => {
  const [inputText, setInputText] = useState('');
  const [transactionCompleted, setTransactionCompleted] = useState(false);

  const handleSend = () => {
    if (inputText.trim()) {
      sendMessage(inputText);
      setInputText('');
    }
  };

  const handleCompleteTransaction = () => {
    setTransactionCompleted(true);
    alert('거래가 완료되었습니다! 후기를 작성해주세요.');
  };

  const handleWriteReview = () => {
    if (activeChat) {
      setReviewTarget({
        productTitle: activeChat.title,
        sellerName: activeChat.seller,
        productId: activeChat.id
      });
      setCurrentScreen('review-write');
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 flex items-center gap-3">
        <ChevronLeft className="w-6 h-6 cursor-pointer" onClick={() => setCurrentScreen('chatlist')} />
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-2xl">
          {activeChat?.emoji}
        </div>
        <div className="flex-1">
          <div className="font-semibold">{activeChat?.seller}</div>
          <div className="text-xs opacity-90">{activeChat?.title}</div>
        </div>
      </div>

      {transactionCompleted && (
        <div className="bg-gradient-to-r from-green-50 to-yellow-50 border-b border-green-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-green-800 mb-1">✅ 거래가 완료되었습니다</div>
              <div className="text-sm text-green-600">거래는 어떠셨나요? 후기를 남겨주세요!</div>
            </div>
            <button
              onClick={handleWriteReview}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:opacity-90 transition whitespace-nowrap"
            >
              후기 작성
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`mb-4 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] ${msg.sender === 'user' ? 'bg-yellow-500 text-white' : 'bg-white text-gray-800'} px-4 py-2 rounded-2xl`}>
              <div>{msg.text}</div>
              <div className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-yellow-100' : 'text-gray-400'}`}>
                {msg.time}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t bg-white">
        {!transactionCompleted && (
          <div className="p-3 border-b bg-gray-50">
            <button
              onClick={handleCompleteTransaction}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-2 rounded-lg font-semibold hover:opacity-90 transition"
            >
              ✓ 거래 완료하기
            </button>
          </div>
        )}

        <div className="p-4 flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="메시지를 입력하세요..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
          <button
            onClick={handleSend}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-2 rounded-full hover:opacity-90 transition"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
