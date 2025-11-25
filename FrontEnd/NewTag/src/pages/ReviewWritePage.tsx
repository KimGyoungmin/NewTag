import { useMemo, useState } from "react";
import { ChevronLeft, Star } from "lucide-react";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { reviewApi } from "../services/api/reviewApi";
import type { ReviewNavigationPayload } from "../types";
import { toast } from "sonner";
import { resolveImageUrl } from "../utils/image";

interface ReviewWritePageProps {
  payload: ReviewNavigationPayload | null;
  onNavigate: (page: string, id?: string) => void;
}

export function ReviewWritePage({ payload, onNavigate }: ReviewWritePageProps) {
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const productImage = useMemo(() => resolveImageUrl(payload?.sellerProfileImg), [payload]);

  const handleSubmit = async () => {
    if (!payload?.transactionId || !payload?.targetId) {
      toast.error("필수 정보가 없어 리뷰를 저장할 수 없습니다.");
      return;
    }

    if (!content.trim()) {
      toast.error("내용을 입력해 주세요.");
      return;
    }

    try {
      setSubmitting(true);
      await reviewApi.createReview({
        transactionId: payload.transactionId,
        targetId: payload.targetId,
        rating,
        content: content.trim(),
      });
      toast.success("리뷰가 저장되었습니다.");
      if (payload.chatId) {
        onNavigate("chatroom", payload.chatId);
      } else if (payload.productId) {
        onNavigate("detail", payload.productId.toString());
      } else {
        onNavigate("home");
      }
    } catch (error) {
      console.error("Failed to submit review", error);
      toast.error("리뷰 저장 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!payload) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="sticky top-0 z-50 flex items-center justify-between border-b bg-background/95 px-4 h-14">
          <Button variant="ghost" size="icon" onClick={() => onNavigate("home")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-base font-semibold">리뷰 작성</h2>
          <div className="w-10" />
        </div>
        <div className="flex flex-col items-center justify-center flex-1 p-8 text-center gap-4">
          <p className="text-muted-foreground">리뷰를 작성할 정보를 찾을 수 없습니다.</p>
          <Button onClick={() => onNavigate("home")}>홈으로 돌아가기</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16 flex flex-col">
      <div className="sticky top-0 z-50 flex items-center justify-between border-b bg-background/95 px-4 h-14">
        <Button variant="ghost" size="icon" onClick={() => onNavigate("chat")}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-base font-semibold">리뷰 작성</h2>
        <div className="w-10" />
      </div>

      <div className="container mx-auto max-w-2xl w-full flex-1 px-4 py-6 space-y-6">
        <div className="rounded-2xl border bg-card shadow-sm p-4 flex gap-4 items-center">
          <img
            src={productImage}
            alt={payload.productTitle || "거래 상품"}
            className="h-16 w-16 rounded-xl object-cover border"
          />
          <div className="flex flex-col min-w-0">
            <p className="text-xs text-muted-foreground">거래 상품</p>
            <p className="font-semibold truncate">{payload.productTitle || "상품"}</p>
            <p className="text-sm text-muted-foreground">판매자: {payload.sellerName || payload.sellerNick || "-"}</p>
          </div>
        </div>

        <div className="rounded-2xl border bg-card shadow-sm p-6 space-y-6">
          <div>
            <label className="text-sm font-medium mb-3 block">별점을 선택해 주세요</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className="transition-transform hover:scale-110"
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHoveredRating(value)}
                  onMouseLeave={() => setHoveredRating(0)}
                >
                  <Star
                    className={`h-10 w-10 ${
                      value <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-lg font-medium">{rating}.0</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">거래 후기를 작성해 주세요</label>
            <Textarea
              placeholder="좋았던 점이나 개선이 필요한 점을 적어 주세요."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[180px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-2">{content.length} / 500자</p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() =>
                payload.chatId ? onNavigate("chatroom", payload.chatId) : onNavigate("chat")
              }
            >
              취소
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "저장 중..." : "리뷰 저장"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
