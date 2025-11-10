import { MoreVertical, Edit, Trash2, EyeOff, Eye } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { ProductStatus } from "../utils/localStorage";

interface MyProductCardProps {
  id: string;
  image: string;
  title: string;
  price: number;
  location: string;
  timeAgo: string;
  likes: number;
  chatCount: number;
  status?: ProductStatus;
  isHidden?: boolean;
  onClick?: () => void;
  onEdit?: (productId: string) => void;
  onStatusChange?: (productId: string, status: ProductStatus) => void;
  onDelete?: (productId: string) => void;
  onToggleVisibility?: (productId: string) => void;
}

export function MyProductCard({ 
  id,
  image, 
  title, 
  price, 
  location, 
  timeAgo, 
  likes,
  chatCount,
  status = 'available',
  isHidden = false,
  onClick,
  onEdit,
  onStatusChange,
  onDelete,
  onToggleVisibility,
}: MyProductCardProps) {
  const getStatusText = () => {
    switch (status) {
      case 'available':
        return '판매중';
      case 'reserved':
        return '예약중';
      case 'sold':
        return '판매완료';
      default:
        return '판매중';
    }
  };

  const getStatusBadgeVariant = () => {
    switch (status) {
      case 'available':
        return 'default';
      case 'reserved':
        return 'secondary';
      case 'sold':
        return 'outline';
      default:
        return 'default';
    }
  };

  return (
    <div className="group overflow-hidden rounded-xl bg-card border transition-all hover:shadow-md">
      <div className="relative cursor-pointer" onClick={onClick}>
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
          {isHidden && (
            <div className="absolute top-2 left-2">
              <Badge variant="outline" className="bg-black/60 text-white border-white/20">
                숨김
              </Badge>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="line-clamp-2 flex-1">{title}</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onStatusChange?.(id, 'available');
              }}>
                판매중으로 변경
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onStatusChange?.(id, 'reserved');
              }}>
                예약중으로 변경
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onStatusChange?.(id, 'sold');
              }}>
                판매완료로 변경
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onEdit?.(id);
              }}>
                <Edit className="h-4 w-4 mr-2" />
                수정
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onToggleVisibility?.(id);
              }}>
                {isHidden ? (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    보이기
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    숨기기
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(id);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex items-center gap-2 mb-2">
          <span className="text-foreground">{price.toLocaleString()}원</span>
          <Badge variant={getStatusBadgeVariant() as any}>
            {getStatusText()}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{location} · {timeAgo}</span>
          <div className="flex items-center gap-2">
            <span>❤️ {likes}</span>
            <span>채팅 {chatCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}