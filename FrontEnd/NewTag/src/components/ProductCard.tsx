import { Heart } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useState, useEffect } from "react";
import { isFavorite, toggleFavorite } from "../utils/localStorage";

/**
 * ============================================
 * 상품 카드 컴포넌트
 * ============================================
 * 
 * 홈 화면, 검색 결과 등에서 사용되는 상품 카드
 * 
 * 주요 기능:
 * - 상품 이미지, 제목, 가격 표시
 * - 찜하기 기능 (하트 아이콘)
 * - 상품 상태 뱃지 (예약중/판매완료)
 * - 좋아요/채팅 수 표시
 */

interface ProductCardProps {
  id: string;
  image: string;
  title: string;
  price: number;
  location: string;
  timeAgo: string;
  likes: number;
  chatCount: number;
  status?: 'available' | 'reserved' | 'sold';
  onClick?: () => void;
}

export function ProductCard({ 
  id,
  image, 
  title, 
  price, 
  location, 
  timeAgo, 
  likes,
  chatCount,
  status = 'available',
  onClick 
}: ProductCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);

  useEffect(() => {
    setIsLiked(isFavorite(id));
  }, [id]);

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newIsLiked = toggleFavorite(id);
    setIsLiked(newIsLiked);
    setLikeCount(prev => newIsLiked ? prev + 1 : prev - 1);
  };

  return (
    <div 
      onClick={onClick}
      className="group cursor-pointer overflow-hidden rounded-xl bg-card border transition-all hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <ImageWithFallback 
          src={image} 
          alt={title}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
        {status !== 'available' && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Badge variant="secondary" className="bg-white">
              {status === 'reserved' ? '예약중' : '판매완료'}
            </Badge>
          </div>
        )}
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/90 hover:bg-white"
          onClick={handleLikeClick}
        >
          <Heart 
            className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
          />
        </Button>
      </div>
      
      <div className="p-4">
        <h3 className="line-clamp-2 mb-2">{title}</h3>
        <div className="mb-3">
          <span className="text-foreground">{price.toLocaleString()}원</span>
        </div>
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground truncate">
            {location} · {timeAgo}
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
              {likeCount}
            </span>
            <span>채팅 {chatCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}