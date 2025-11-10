import { useState, useEffect, useRef } from "react";
import { ChevronLeft, MoreVertical, Send, Image as ImageIcon, ChevronDown, Plus, MapPin, Video, ShieldCheck } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { getChatById, addMessageToChat, getProductStatus, setProductStatus as saveProductStatus, ProductStatus, deleteChat, markChatAsRead } from "../utils/localStorage";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";

interface ChatPageProps {
  chatId: string;
  onNavigate: (page: string, id?: string) => void;
}

export function ChatPage({ chatId, onNavigate }: ChatPageProps) {
  const [message, setMessage] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // localStorage에서 실제 채팅 데이터 가져오기
  const chatData = getChatById(chatId);
  
  const [messages, setMessages] = useState(chatData?.messages || []);
  const [productStatus, setProductStatus] = useState<ProductStatus>(
    chatData ? getProductStatus(chatData.productId) : 'available'
  );

  // 채팅방 진입 시 읽음 처리
  useEffect(() => {
    markChatAsRead(chatId);
  }, [chatId]);

  // chatId가 변경될 때만 메시지 동기화
  useEffect(() => {
    const currentChatData = getChatById(chatId);
    if (currentChatData) {
      setMessages(currentChatData.messages);
      setProductStatus(getProductStatus(currentChatData.productId));
    }
  }, [chatId]);

  // 메시지가 추가될 때마다 맨 아래로 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleStatusChange = (status: ProductStatus) => {
    setProductStatus(status);
    saveProductStatus(chat.productId, status);
  };

  const getStatusText = (status: ProductStatus) => {
    switch (status) {
      case 'available':
        return '판매중';
      case 'reserved':
        return '예약중';
      case 'sold':
        return '판매완료';
    }
  };

  const getStatusColor = (status: ProductStatus) => {
    switch (status) {
      case 'available':
        return 'bg-emerald-500';
      case 'reserved':
        return 'bg-orange-500';
      case 'sold':
        return 'bg-gray-500';
    }
  };

  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? '오후' : '오전';
    const displayHours = hours % 12 || 12;
    return `${ampm} ${displayHours}:${minutes.toString().padStart(2, '0')}`;
  };

  const handleSend = () => {
    if (message.trim()) {
      const timestamp = getCurrentTime();
      
      // localStorage에 메시지 추가
      addMessageToChat(chatId, {
        text: message,
        sender: 'me',
        timestamp: timestamp,
      });
      
      // 로컬 state 업데이트
      const newMessage = {
        id: `msg-${Date.now()}`,
        text: message,
        sender: 'me' as const,
        timestamp: timestamp,
        createdAt: Date.now(),
      };
      
      setMessages([...messages, newMessage]);
      setMessage('');
    }
  };

  const handleImageUpload = () => {
    toast.success('이미지 전송 기능 (개발 중)');
  };

  const handleLocationShare = () => {
    toast.success('위치 공유 기능 (개발 중)');
  };

  const handleVideoUpload = () => {
    toast.success('동영상 전송 기능 (개발 중)');
  };

  const handleSafeTrade = () => {
    toast.success('안전 거래 기능 (개발 중)');
  };

  const handleDeleteChat = () => {
    deleteChat(chatId);
    onNavigate('chat');
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 flex items-center justify-between border-b bg-background px-4 h-14">
        <div className="flex items-center gap-3 flex-1">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onNavigate('chat')}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-9 w-9">
            <AvatarImage src={chat.userImage} />
            <AvatarFallback>{chat.userName[0]}</AvatarFallback>
          </Avatar>
          <span>{chat.userName}</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              채팅방 나가기
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Product Info Card */}
      <div className="border-b bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <div 
            className="h-12 w-12 overflow-hidden rounded-lg border shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onNavigate('detail', chat.productId)}
          >
            <ImageWithFallback
              src={chat.productImage}
              alt={chat.productTitle}
              className="h-full w-full object-cover"
            />
          </div>
          <div 
            className="flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onNavigate('detail', chat.productId)}
          >
            <p className="truncate text-sm">{chat.productTitle}</p>
            <p className="text-sm">{chat.productPrice.toLocaleString()}원</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                상태변경
                <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => handleStatusChange('available')}>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                  판매중
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('reserved')}>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                  예약중
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('sold')}>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-gray-500"></div>
                  판매완료
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Badge className={getStatusColor(productStatus)}>
            {getStatusText(productStatus)}
          </Badge>
        </div>
      </div>

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'transparent transparent',
          transition: 'scrollbar-color 0.3s ease-out'
        }}
        onScroll={(e) => {
          const target = e.currentTarget;
          target.style.scrollbarColor = 'rgb(156 163 175) transparent';
          target.style.transition = 'scrollbar-color 0s';
          clearTimeout((target as any).scrollTimeout);
          (target as any).scrollTimeout = setTimeout(() => {
            target.style.transition = 'scrollbar-color 0.5s ease-out';
            target.style.scrollbarColor = 'transparent transparent';
          }, 1000);
        }}
      >
        <div className="text-center">
          <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
            2024년 11월 4일
          </span>
        </div>

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender !== 'me' && (
              <Avatar 
                className="h-8 w-8 shrink-0 cursor-pointer" 
                onClick={() => onNavigate('seller-profile')}
              >
                <AvatarImage src={chat.userImage} />
                <AvatarFallback>{chat.userName[0]}</AvatarFallback>
              </Avatar>
            )}
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                msg.sender === 'me'
                  ? 'bg-primary text-white rounded-br-sm'
                  : 'bg-secondary text-foreground rounded-bl-sm'
              }`}
            >
              <p className="break-words">{msg.text}</p>
              <p
                className={`mt-1 text-xs ${
                  msg.sender === 'me' ? 'text-white/70' : 'text-muted-foreground'
                }`}
              >
                {msg.timestamp}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t bg-background p-4">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Plus className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={handleImageUpload}>
                <ImageIcon className="mr-2 h-4 w-4" />
                이미지 전송
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleVideoUpload}>
                <Video className="mr-2 h-4 w-4" />
                동영상 전송
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLocationShare}>
                <MapPin className="mr-2 h-4 w-4" />
                위치 공유
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSafeTrade}>
                <ShieldCheck className="mr-2 h-4 w-4" />
                안전 거래
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Input
            type="text"
            placeholder="메시지를 입력하세요"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-secondary border-0"
          />
          <Button 
            size="icon" 
            className="shrink-0 bg-primary hover:bg-primary-hover"
            onClick={handleSend}
            disabled={!message.trim()}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Delete Chat Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>채팅방 나가기</AlertDialogTitle>
            <AlertDialogDescription>
              이 채팅방을 나가시겠습니까? 대화 내용이 모두 삭제되며 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteChat}>나가기</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}