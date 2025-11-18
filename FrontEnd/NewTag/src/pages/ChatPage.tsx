import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, Send } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { chatService } from "../services/firebase/chatService";
import { db } from "../services/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { authApi } from "../api/auth";
import type { AuthUser, ChatMessage, ChatRoom } from "../types";

interface ChatPageProps {
  chatId: string;
  onNavigate: (page: string, id?: string) => void;
}

export function ChatPage({ chatId, onNavigate }: ChatPageProps) {
  const [message, setMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateUser = () => {
      setCurrentUser(authApi.getCurrentUser());
    };

    updateUser();
    window.addEventListener("auth-change", updateUser);
    return () => window.removeEventListener("auth-change", updateUser);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "chatRooms", chatId));
        if (snap.exists()) {
          const data = snap.data() as any;
          const roomData: ChatRoom = {
            id: snap.id,
            productId: data.productId,
            productTitle: data.productTitle,
            productImage: data.productImage,
            productPrice: data.productPrice,
            sellerId: data.sellerId,
            sellerNick: data.sellerNick,
            sellerProfileImg: data.sellerProfileImg,
            buyerId: data.buyerId,
            buyerNick: data.buyerNick,
            buyerProfileImg: data.buyerProfileImg,
            lastMessage: data.lastMessage,
            lastMessageAt: data.lastMessageAt?.toDate?.() || undefined,
            createdAt: data.createdAt?.toDate?.() || new Date(),
            updatedAt: data.updatedAt?.toDate?.() || new Date(),
          };
          setRoom(roomData);
        }
      } catch (e) {
        console.error("Failed to load chat room", e);
      }
    })();
  }, [chatId]);

  useEffect(() => {
    const unsub = chatService.subscribeToMessages(chatId, (list) => {
      setMessages(list);
    });
    return () => unsub();
  }, [chatId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (currentUser) {
      chatService.markAsRead(chatId, currentUser.id).catch((e) =>
        console.error("markAsRead failed", e)
      );
    }
  }, [chatId, currentUser, messages.length]);

  const peer = useMemo(() => {
    if (!currentUser || !room) return { nick: "", img: "" };
    const isSeller = currentUser.id === room.sellerId;
    return {
      nick: isSeller ? room.buyerNick : room.sellerNick,
      img: isSeller ? room.buyerProfileImg : room.sellerProfileImg,
    };
  }, [currentUser, room]);

  const handleSend = async () => {
    const text = message.trim();
    if (!text || !currentUser) return;
    try {
      await chatService.sendMessage(
        chatId,
        currentUser.id,
        currentUser.nick,
        currentUser.profileImg,
        text
      );
      setMessage("");
    } catch (e) {
      console.error("Failed to send message", e);
    }
  };

  function formatTime(d: Date): string {
    const h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? "오후" : "오전";
    const hh = h % 12 || 12;
    return `${ampm} ${hh}:${m.toString().padStart(2, "0")}`;
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 flex items-center justify-between border-b bg-background px-4 h-14">
        <div className="flex items-center gap-3 flex-1">
          <Button variant="ghost" size="icon" onClick={() => onNavigate("chat")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-9 w-9">
            <AvatarImage src={peer.img} />
            <AvatarFallback>{peer.nick?.[0] || "?"}</AvatarFallback>
          </Avatar>
          <span>{peer.nick}</span>
        </div>
      </div>

      {/* Product Info Card */}
      {room && (
        <div className="border-b bg-card px-4 py-3">
          <div className="flex items-center gap-3">
            <div
              className="h-12 w-12 overflow-hidden rounded-lg border shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onNavigate("detail", String(room.productId))}
            >
              <ImageWithFallback
                src={room.productImage}
                alt={room.productTitle}
                className="h-full w-full object-cover"
              />
            </div>
            <div
              className="flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onNavigate("detail", String(room.productId))}
            >
              <p className="truncate text-sm">{room.productTitle}</p>
              <p className="text-sm">{room.productPrice?.toLocaleString()}원</p>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((msg) => {
          const isMine = currentUser && msg.senderId === currentUser.id;
          return (
            <div key={msg.id} className={`flex gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
              {!isMine && (
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={peer.img} />
                  <AvatarFallback>{peer.nick?.[0] || "?"}</AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                  isMine ? "bg-primary text-white rounded-br-sm" : "bg-secondary text-foreground rounded-bl-sm"
                }`}
              >
                <p className="break-words">{msg.message}</p>
                <p className={`mt-1 text-xs ${isMine ? "text-white/70" : "text-muted-foreground"}`}>
                  {formatTime(msg.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t bg-background p-4">
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="메시지를 입력하세요"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
            className="flex-1 bg-secondary border-0"
          />
          <Button
            size="icon"
            className="shrink-0 bg-primary hover:bg-primary/90"
            onClick={handleSend}
            disabled={!message.trim()}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

