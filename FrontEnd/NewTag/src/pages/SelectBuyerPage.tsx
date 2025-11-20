import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, MessageSquare } from "lucide-react";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { productApi } from "../api/productApi";
import { authApi } from "../api/auth";
import { chatService } from "../services/firebase/chatService";
import type { Product } from "../types";
import { resolveImageUrl } from "../utils/image";
import { toast } from "sonner";

interface SelectBuyerPageProps {
  productId: string;
  onNavigate: (page: string, id?: string) => void;
}

interface BuyerCandidate {
  chatId: string;
  buyerId: number;
  buyerNick?: string;
  buyerProfileImg?: string;
  lastMessage?: string;
  lastMessageAt?: Date | null;
}

export function SelectBuyerPage({ productId, onNavigate }: SelectBuyerPageProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [candidates, setCandidates] = useState<BuyerCandidate[]>([]);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [submittingBuyerId, setSubmittingBuyerId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentUser = authApi.getCurrentUser();

  useEffect(() => {
    const loadProduct = async () => {
      if (!productId) {
        setError("잘못된 상품 정보입니다.");
        setLoadingProduct(false);
        return;
      }

      try {
        setLoadingProduct(true);
        const data = await productApi.getById(Number(productId));
        if (!data) {
          setError("상품 정보를 불러올 수 없습니다.");
          return;
        }
        setProduct(data);
      } catch (err) {
        console.error("Failed to load product.", err);
        setError("상품 정보를 불러올 수 없습니다.");
      } finally {
        setLoadingProduct(false);
      }
    };

    loadProduct();
  }, [productId]);

  useEffect(() => {
    const loadCandidates = async () => {
      if (!product || !currentUser) return;

      try {
        setLoadingCandidates(true);
        const items = await chatService.getBuyerCandidatesForProduct(product.id, currentUser.id);
        const unique = new Map<number, BuyerCandidate>();
        items.forEach((item) => {
          if (item.buyerId) {
            unique.set(item.buyerId, item);
          }
        });
        setCandidates(Array.from(unique.values()));
      } catch (err) {
        console.error("Failed to load chat participants.", err);
        toast.error("채팅 참가자 정보를 불러오지 못했습니다.");
      } finally {
        setLoadingCandidates(false);
      }
    };

    loadCandidates();
  }, [product, currentUser]);

  const mainImage = useMemo(() => {
    if (!product) return resolveImageUrl(undefined);
    const main = product.images?.find((img: any) => img.isMain);
    const path = main?.pImg || main?.pimg;
    if (path) {
      return resolveImageUrl(path);
    }
    return resolveImageUrl(undefined);
  }, [product]);

  const formatRelativeTime = (date?: Date | null) => {
    if (!date) return "시간 정보 없음";
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "방금 전";
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}일 전`;
    return `${Math.floor(days / 7)}주 전`;
  };

  const handleSelectBuyer = async (candidate: BuyerCandidate) => {
    if (!product) return;

    setSubmittingBuyerId(candidate.buyerId);
    try {
      const result = await productApi.completeSale(product.id, candidate.buyerId);

      if (result?.product) {
        setProduct(result.product);
      }

      if (
        result?.transactionId &&
        candidate.chatId &&
        currentUser?.id &&
        product.sellerId
      ) {
        await chatService.sendReviewRequestMessage(
          candidate.chatId,
          { id: currentUser.id, nick: currentUser.nick, profileImg: currentUser.profileImg },
          {
            transactionId: result.transactionId,
            targetId: product.sellerId,
            productId: product.id,
            productTitle: product.title,
            sellerName: product.seller?.name || currentUser.name,
            sellerNick: product.seller?.nick || currentUser.nick,
            sellerProfileImg: product.seller?.profileImg || currentUser.profileImg,
            buyerId: candidate.buyerId,
            chatId: candidate.chatId,
          }
        );
      }

      toast.success("구매자가 지정되어 판매가 완료되었습니다.");
      onNavigate("detail", product.id.toString());
    } catch (err) {
      console.error("Failed to complete sale.", err);
      toast.error("판매 완료 처리 중 문제가 발생했습니다.");
    } finally {
      setSubmittingBuyerId(null);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="sticky top-0 z-50 flex items-center justify-between border-b bg-background/95 px-4 h-14">
          <Button variant="ghost" size="icon" onClick={() => onNavigate("login")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-base font-semibold">구매자 선택</h2>
          <div className="w-10" />
        </div>
        <div className="flex flex-col items-center justify-center flex-1 p-8 text-center gap-4">
          <p className="text-muted-foreground">로그인이 필요한 기능입니다.</p>
          <Button onClick={() => onNavigate("login")}>로그인하러 가기</Button>
        </div>
      </div>
    );
  }

  if (loadingProduct) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="sticky top-0 z-50 flex items-center justify-between border-b bg-background/95 px-4 h-14">
          <Button variant="ghost" size="icon" onClick={() => onNavigate("detail", productId)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-base font-semibold">구매자 선택</h2>
          <div className="w-10" />
        </div>
        <div className="flex flex-col items-center justify-center flex-1 p-8 text-center gap-4">
          <p className="text-muted-foreground">상품 정보를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="sticky top-0 z-50 flex items-center justify-between border-b bg-background/95 px-4 h-14">
          <Button variant="ghost" size="icon" onClick={() => onNavigate("home")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-base font-semibold">구매자 선택</h2>
          <div className="w-10" />
        </div>
        <div className="flex flex-col items-center justify-center flex-1 p-8 text-center gap-4">
          <p className="text-muted-foreground">{error || "상품 정보를 찾을 수 없습니다."}</p>
          <Button onClick={() => onNavigate("home")}>홈으로 돌아가기</Button>
        </div>
      </div>
    );
  }

  const isSeller = currentUser?.id === product.sellerId;

  if (!isSeller) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="sticky top-0 z-50 flex items-center justify-between border-b bg-background/95 px-4 h-14">
          <Button variant="ghost" size="icon" onClick={() => onNavigate("detail", product.id.toString())}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-base font-semibold">구매자 선택</h2>
          <div className="w-10" />
        </div>
        <div className="flex flex-col items-center justify-center flex-1 p-8 text-center gap-4">
          <p className="text-muted-foreground">판매자만 이용할 수 있는 페이지입니다.</p>
          <Button onClick={() => onNavigate("detail", product.id.toString())}>상품으로 돌아가기</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-10 flex flex-col">
      <div className="sticky top-0 z-50 flex items-center justify-between border-b bg-background/95 backdrop-blur px-4 h-14">
        <Button variant="ghost" size="icon" onClick={() => onNavigate("detail", product.id.toString())}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-base font-semibold">구매자 선택</h2>
        <div className="w-10" />
      </div>

      <div className="container mx-auto max-w-2xl flex-1 w-full px-4 py-6 space-y-6">
        <div className="rounded-2xl border bg-card shadow-sm p-4 flex gap-4">
          <img
            src={mainImage}
            alt={product.title}
            className="h-20 w-20 rounded-xl object-cover"
          />
          <div className="flex flex-col">
            <p className="text-sm text-muted-foreground">판매 상품</p>
            <h3 className="text-lg font-semibold">{product.title}</h3>
            <p className="text-base font-medium">{product.price?.toLocaleString()}원</p>
            <p className="text-xs text-muted-foreground">{product.locationNm}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">채팅 중인 구매자</h3>
              <p className="text-sm text-muted-foreground">
                판매할 구매자를 선택하면 거래가 완료 처리됩니다.
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("chat")}>
              채팅 목록 보기
            </Button>
          </div>

          {loadingCandidates && (
            <div className="rounded-xl border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
              채팅 참여자를 불러오는 중입니다...
            </div>
          )}

          {!loadingCandidates && candidates.length === 0 && (
            <div className="rounded-xl border bg-muted/40 p-6 text-center text-sm text-muted-foreground space-y-2">
              <p>이 상품과 대화 중인 구매자가 없습니다.</p>
              <p>채팅을 통해 거래를 진행한 후 다시 시도해 주세요.</p>
            </div>
          )}

          <div className="space-y-3">
            {candidates.map((candidate) => (
              <div
                key={candidate.chatId}
                className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={resolveImageUrl(candidate.buyerProfileImg)} alt={candidate.buyerNick} />
                    <AvatarFallback>{candidate.buyerNick?.[0] ?? "U"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{candidate.buyerNick ?? `사용자 #${candidate.buyerId}`}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      {candidate.lastMessage ? candidate.lastMessage : "최근 메시지가 없습니다."}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(candidate.lastMessageAt)}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  disabled={submittingBuyerId === candidate.buyerId}
                  onClick={() => handleSelectBuyer(candidate)}
                >
                  {submittingBuyerId === candidate.buyerId ? "처리 중..." : "이 구매자로 완료"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
