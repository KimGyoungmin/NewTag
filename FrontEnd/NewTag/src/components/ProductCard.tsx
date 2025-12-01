import { Heart, MapPin } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useState } from "react";
import { favoriteApi } from "../api/favoriteApi";
import { authApi } from "../api/auth";
import { toast } from "sonner";
import { formatDistance } from "../utils/kakaoMap";

interface ProductCardProps {
  id: string;
  image: string;
  title: string;
  price: number;
  location: string;
  timeAgo: string;
  likes: number;
  chatCount: number;
  status?: "available" | "reserved" | "sold";
  isLikedByMe?: boolean;
  distance?: number;
  sellerNick?: string;
  onClick?: () => void;
  onNavigate?: (page: string) => void;
  onFavoriteChange?: (productId: string, isFavorited: boolean) => void;
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
  status = "available",
  isLikedByMe = false,
  distance,
  sellerNick,
  onClick,
  onNavigate,
  onFavoriteChange,
}: ProductCardProps) {
  const [isLiked, setIsLiked] = useState(isLikedByMe);
  const [likeCount, setLikeCount] = useState(likes);

  const currentUser = authApi.getCurrentUser();
  const isOwner = sellerNick && currentUser?.nick === sellerNick;

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const currentUser = authApi.getCurrentUser();
    if (!currentUser) {
      toast.error("로그인이 필요합니다.");
      if (onNavigate) {
        onNavigate("login");
      }
      return;
    }

    const userId = currentUser.id;

    try {
      const response = await favoriteApi.toggleFavorite(Number(id), userId);
      setIsLiked(response.isFavorited);
      setLikeCount(response.favoriteCount);
      onFavoriteChange?.(id, response.isFavorited);
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      toast.error("찜하기 처리 중 오류가 발생했습니다.");
    }
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
        {status !== "available" && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Badge variant="secondary" className="bg-white">
              {status === "reserved" ? "예약중" : "판매완료"}
            </Badge>
          </div>
        )}
        {!isOwner && (
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/90 hover:bg-white"
            onClick={handleLikeClick}
          >
            <Heart
              className={`h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : "text-gray-600"}`}
            />
          </Button>
        )}
      </div>

      <div className="p-4">
        <h3 className="line-clamp-2 mb-2">{title}</h3>
        <div className="mb-3">
          <span className="text-foreground">{price.toLocaleString()}원</span>
        </div>
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground truncate">
            {location}
            {distance !== undefined && (
              <>
                {" · "}
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {formatDistance(distance)}
                </span>
              </>
            )}
            {" · "}
            {timeAgo}
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {!isOwner && (
              <span className="flex items-center gap-1">
                <Heart className={`h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
                {likeCount}
              </span>
            )}
            <span>채팅 {chatCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
