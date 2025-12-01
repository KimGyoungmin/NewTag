import { useState } from "react";
import { Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { toast } from "sonner";
import { addReview, getUserProfile } from "../utils/localStorage";

/**
 * ============================================
 * 거래 후기 작성 Dialog 컴포넌트
 * ============================================
 * 
 * 구매 완료 후 판매자에게 후기를 남기는 모달
 * 
 * 주요 기능:
 * - 별점 선택 (1~5점)
 * - 후기 내용 작성 (최대 500자)
 * - 판매자 정보 표시
 * - localStorage에 후기 저장
 */

interface ReviewDialogProps {
  open: boolean;
  onClose: () => void;
  productId: string;
  productTitle: string;
  sellerName: string;
  sellerImage: string;
}

export function ReviewDialog({
  open,
  onClose,
  productId,
  productTitle,
  sellerName,
  sellerImage,
}: ReviewDialogProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);
  const userProfile = getUserProfile();

  const handleSubmit = () => {
    if (!comment.trim()) {
      toast.error("후기 내용을 입력해주세요");
      return;
    }

    const now = new Date();
    const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;

    addReview({
      productId,
      productTitle,
      reviewer: userProfile.name,
      reviewerImage: userProfile.profileImage,
      rating,
      comment: comment.trim(),
      date: dateStr,
    });

    toast.success("후기가 등록되었습니다");
    setRating(5);
    setComment("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>거래 후기 작성</DialogTitle>
          <DialogDescription>
            {sellerName}님과의 거래는 어떠셨나요?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Seller Info */}
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={sellerImage} />
              <AvatarFallback>{sellerName[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{sellerName}</p>
              <p className="text-sm text-muted-foreground">{productTitle}</p>
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="text-sm font-medium mb-3 block">평점을 선택해주세요</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHoveredRating(value)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
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

          {/* Comment */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              후기를 작성해주세요
            </label>
            <Textarea
              placeholder="따뜻한 후기를 남겨주세요&#10;예) 친절하시고 물건 상태도 ��았어요!"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[120px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-2">
              {comment.length} / 500자
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSubmit}>등록하기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}