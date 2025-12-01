import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, Image as ImageIcon, MapPin, MoreVertical, Plus, Send } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
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
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { KakaoMap } from "../components/KakaoMap";
import { chatService } from "../services/firebase/chatService";
import { db } from "../services/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { authApi } from "../api/auth";
import { reviewApi } from "../services/api/reviewApi";
import { postApi } from "../api/postApi";
import { resolveImageUrl } from "../utils/image";
import { getAddressFromCoords, getCurrentPosition } from "../utils/kakaoMap";
import { toast } from "sonner";
import type { AuthUser, ChatMessage, ChatLocation, ChatRoom, ReviewNavigationPayload } from "../types";

interface ChatPageProps {
  chatId: string;
  onNavigate: (page: string, id?: string) => void;
}

export function ChatPage({ chatId, onNavigate }: ChatPageProps) {
  const [message, setMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<Record<number, boolean>>({});
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const firstScrollDone = useRef(false);

  // 채팅방이 바뀔 때마다 스크롤 초기화
  useEffect(() => {
    firstScrollDone.current = false;
  }, [chatId]);

  // 로그인 사용자 동기화
  useEffect(() => {
    const updateUser = () => setCurrentUser(authApi.getCurrentUser());
    updateUser();
    window.addEventListener("auth-change", updateUser);
    return () => window.removeEventListener("auth-change", updateUser);
  }, []);

  // 채팅방 정보 로드
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

  // 메시지 구독
  useEffect(() => {
    const unsub = chatService.subscribeToMessages(chatId, (list) => {
      setMessages(list);
    });
    return () => unsub();
  }, [chatId]);

  // 새 메시지에 맞춰 스크롤
  useLayoutEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const isInitial = !firstScrollDone.current;
    if (isInitial) {
      el.scrollTop = el.scrollHeight;
      firstScrollDone.current = true;
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    } else {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  // 읽음 처리
  useEffect(() => {
    if (currentUser) {
      chatService.markAsRead(chatId, currentUser.id).catch((e) => console.error("markAsRead failed", e));
    }
  }, [chatId, currentUser, messages.length]);

  // 리뷰 작성 여부 조회
  useEffect(() => {
    const fetchStatuses = async () => {
      if (!currentUser) return;
      const ids = Array.from(
        new Set(
          messages
            .map((m) => m.reviewPayload?.transactionId)
            .filter((id): id is number => typeof id === "number")
        )
      ).filter((id) => reviewStatus[id] === undefined);
      if (ids.length === 0) return;

      try {
        const entries = await Promise.all(
          ids.map(async (id) => {
            const exists = await reviewApi.existsReview(id);
            return [id, exists] as const;
          })
        );
        setReviewStatus((prev) => {
          const next = { ...prev };
          for (const [id, exists] of entries) next[id] = exists;
          return next;
        });
      } catch (e) {
        console.error("Failed to check review existence", e);
      }
    };
    fetchStatuses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, currentUser]);

  const peer = useMemo(() => {
    if (!currentUser || !room) return { nick: "", img: "" };
    const seller = currentUser.id === room.sellerId;
    return {
      nick: seller ? room.buyerNick : room.sellerNick,
      img: seller ? room.buyerProfileImg : room.sellerProfileImg,
    };
  }, [currentUser, room]);

  const isBuyer = currentUser && room ? currentUser.id === room.buyerId : false;
  const isSeller = currentUser && room ? currentUser.id === room.sellerId : false;

  const handleSend = async () => {
    const text = message.trim();
    if (!text || !currentUser) return;

    const optimistic: ChatMessage = {
      id: `temp-${Date.now()}`,
      chatRoomId: chatId,
      senderId: currentUser.id,
      senderNick: currentUser.nick,
      senderProfileImg: currentUser.profileImg || "",
      message: text,
      createdAt: new Date(),
      isRead: false,
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      await chatService.sendMessage(chatId, currentUser.id, currentUser.nick, currentUser.profileImg || "", text);
      setMessage("");
    } catch (e) {
      console.error("Failed to send message", e);
    }
  };

  const handleImageSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!currentUser) {
      toast.error("로그인 후 이용해주세요.");
      event.target.value = "";
      return;
    }

    try {
      setIsUploadingImage(true);
      const uploaded = await postApi.uploadImage(file);
      const imageUrl = resolveImageUrl(uploaded.url || uploaded.path);
      await chatService.sendMessage(
        chatId,
        currentUser.id,
        currentUser.nick,
        currentUser.profileImg || "",
        "사진을 보냈습니다.",
        { messageType: "image", imageUrl }
      );
      toast.success("이미지를 전송했어요.");
    } catch (e) {
      console.error("Failed to upload image", e);
      toast.error("이미지를 보내지 못했어요. 다시 시도해주세요.");
    } finally {
      setIsUploadingImage(false);
      event.target.value = "";
    }
  };

  const handleShareLocation = async () => {
    if (!currentUser) {
      toast.error("로그인 후 이용해주세요.");
      return;
    }

    try {
      setIsSharingLocation(true);
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;
      let address = "";
      try {
        address = await getAddressFromCoords(latitude, longitude);
      } catch (err) {
        console.error("Failed to resolve address", err);
      }

      await chatService.sendMessage(
        chatId,
        currentUser.id,
        currentUser.nick,
        currentUser.profileImg || "",
        address || "위치를 공유했습니다.",
        {
          messageType: "location",
          location: { lat: latitude, lng: longitude, address },
        }
      );
      toast.success("현재 위치를 공유했어요.");
    } catch (e) {
      console.error("Failed to share location", e);
      const msg = e instanceof Error ? e.message : "위치를 공유하지 못했어요.";
      toast.error(msg);
    } finally {
      setIsSharingLocation(false);
    }
  };

  const handleReviewLink = (payload: ReviewNavigationPayload) => {
    onNavigate("review-write", JSON.stringify(payload));
  };

  function formatTime(d: Date): string {
    const h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? "오후" : "오전";
    const hh = h % 12 || 12;
    return `${ampm} ${hh}:${m.toString().padStart(2, "0")}`;
  }

  const handleLeaveChat = async () => {
    setIsLeaving(true);
    try {
      await chatService.deleteChatRoom(chatId);
      setMessages([]);
      setRoom(null);
      onNavigate("chat");
    } catch (e) {
      console.error("Failed to leave chat", e);
    } finally {
      setIsLeaving(false);
      setIsLeaveDialogOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-background px-4 h-14 shrink-0 z-50">
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
        <AlertDialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-destructive" onClick={() => setIsLeaveDialogOpen(true)}>
                채팅방 나가기
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>채팅방을 나갈까요?</AlertDialogTitle>
              <AlertDialogDescription>
                채팅방을 나가면 이전 대화 내용이 모두 삭제되고 채팅 목록에서 사라집니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLeaving}>취소하기</AlertDialogCancel>
              <AlertDialogAction onClick={handleLeaveChat} disabled={isLeaving}>
                {isLeaving ? "나가는 중..." : "나가기"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Product Info */}
        {room && (
          <div className="border-b bg-card px-4 py-3 shrink-0">
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
        <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto px-4 pt-6 pb-28">
          <div className="flex flex-col justify-end gap-4 min-h-full">
            {messages.map((msg) => {
              const isMine = currentUser && msg.senderId === currentUser.id;
              const reviewed =
                msg.reviewPayload?.reviewCompleted === true ||
                msg.reviewPayload?.isReviewed === true ||
                (typeof msg.reviewPayload?.transactionId === "number" &&
                  reviewStatus[msg.reviewPayload.transactionId] === true);
              const isImageMessage = msg.messageType === "image" && !!msg.imageUrl;
              const isLocationMessage = msg.messageType === "location" && !!msg.location;
              const locationText = isLocationMessage ? msg.location?.address || msg.message : msg.message;
              const locationLink =
                isLocationMessage && msg.location
                  ? `https://map.kakao.com/link/map/${encodeURIComponent(
                      msg.location.address || "?? ??"
                    )},${msg.location.lat},${msg.location.lng}`
                  : "";
              const locationLat = msg.location?.lat ?? 37.5665;
              const locationLng = msg.location?.lng ?? 126.978;
              return (
                <div key={msg.id} className={`flex gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
                  {!isMine && (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={peer.img} />
                      <AvatarFallback>{peer.nick?.[0] || "?"}</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-3 ${
                      isMine ? "bg-primary text-white rounded-br-sm" : "bg-secondary text-foreground rounded-bl-sm"
                    }`}
                  >
                    <div className="space-y-2">
                      {isImageMessage ? (
                        <a
                          href={msg.imageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block overflow-hidden rounded-xl border border-white/10 bg-background/40"
                        >
                          <img src={msg.imageUrl} alt="shared image" className="max-h-64 w-full object-cover" />
                        </a>
                      ) : isLocationMessage ? (
                        <div className="space-y-2">
                          <p className="break-words font-semibold">{locationText}</p>
                          <div className="overflow-hidden rounded-xl border border-white/10">
                            <KakaoMap
                              latitude={locationLat}
                              longitude={locationLng}
                              locationName={msg.location?.address || "?? ??"}
                              width="100%"
                              height="180px"
                              draggable={false}
                              zoomable={false}
                              showMarker
                            />
                          </div>
                          {locationLink && (
                            <a
                              href={locationLink}
                              target="_blank"
                              rel="noreferrer"
                              className={`text-xs underline-offset-2 hover:underline ${
                                isMine ? "text-white" : "text-foreground"
                              }`}
                            >
                              자세히 보기
                            </a>
                          )}
                        </div>
                      ) : (
                        <p className="break-words">{msg.message}</p>
                      )}
                    {msg.messageType === "review_link" &&
                      !isMine &&
                      msg.reviewPayload &&
                      (isBuyer || isSeller) && (
                        <div className="mt-2">
                          <Button
                            size="sm"
                            className="bg-white text-primary hover:bg-white/90 disabled:opacity-70 disabled:cursor-not-allowed"
                            disabled={reviewed}
                            onClick={() =>
                              handleReviewLink(
                                isBuyer
                                  ? msg.reviewPayload!
                                  : {
                                      ...msg.reviewPayload!,
                                      targetId: msg.reviewPayload!.buyerId,
                                    }
                              )
                            }
                          >
                            {reviewed ? "후기 작성 완료" : "후기 작성하기"}
                          </Button>
                        </div>
                      )}
                      <p className={`text-xs ${isMine ? "text-white/70" : "text-muted-foreground"}`}>
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* Input */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-4 z-50">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0">
                <Plus className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()} disabled={isUploadingImage}>
                <ImageIcon className="mr-2 h-4 w-4" />
                {isUploadingImage ? "이미지 업로드 중..." : "이미지 업로드"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShareLocation} disabled={isSharingLocation}>
                <MapPin className="mr-2 h-4 w-4" />
                {isSharingLocation ? "위치 공유 중..." : "내 위치 공유"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Input
            type="text"
            placeholder="메시지를 입력해주세요"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key == "Enter") handleSend()
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
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelect}
        />
      </div>
    </div>
  );
}