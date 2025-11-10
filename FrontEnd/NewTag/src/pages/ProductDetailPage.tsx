import { useState } from "react";
import { ChevronLeft, MoreVertical, Heart, MapPin, Clock, Eye } from "lucide-react";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
import { 
  getProductById,
  getProductStatus,
  setProductStatus,
  deleteProduct,
  ProductStatus,
  isFavorite,
  toggleFavorite,
  findOrCreateChat,
} from "../utils/localStorage";

interface ProductDetailPageProps {
  productId: string;
  onNavigate: (page: string, id?: string) => void;
}

export function ProductDetailPage({ productId, onNavigate }: ProductDetailPageProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(isFavorite(productId));
  const [productStatus, setProductStatusState] = useState<ProductStatus>(getProductStatus(productId));
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // 실제 상품 데이터 가져오기
  const realProduct = getProductById(productId);

  // 상태 변경 핸들러
  const handleStatusChange = (newStatus: ProductStatus) => {
    setProductStatus(productId, newStatus);
    setProductStatusState(newStatus);
  };

  // 삭제 핸들러
  const handleDelete = () => {
    deleteProduct(productId);
    onNavigate('home');
  };

  // 찜하기 핸들러
  const handleToggleFavorite = () => {
    toggleFavorite(productId);
    setIsLiked(!isLiked);
  };

  // 기본 판매자 정보
  const defaultSeller = {
    id: 'seller-1',
    name: '김철수',
    image: 'https://images.unsplash.com/photo-1640960543409-dbe56ccc30e2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1c2VyJTIwcHJvZmlsZSUyMHBlcnNvbnxlbnwxfHx8fDE3NjIxNzMzNjZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    rating: 4.8,
    reviewCount: 23,
  };

  // Mock data
  const product = realProduct ? {
    ...realProduct,
    images: realProduct.images || [realProduct.image],
    category: realProduct.category || '기타',
    views: 234,
    seller: defaultSeller,
  } : {
    id: productId,
    images: [
      'https://images.unsplash.com/photo-1758186355698-bd0183fc75ed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBlbGVjdHJvbmljcyUyMGdhZGdldHxlbnwxfHx8fDE3NjIxNjI0OTh8MA&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1634824506573-4a430d1d6111?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmdXJuaXR1cmUlMjBob21lJTIwZGVjb3J8ZW58MXx8fHwxNzYyMTgwNjcxfDA&ixlib=rb-4.1.0&q=80&w=1080',
    ],
    title: '아이패드 프로 11인치 M2칩 (2022)',
    price: 850000,
    category: '전자기기',
    status: 'available',
    description: `거의 새 제품입니다. 
    
사용 기간 약 3개월 정도이며, 케이스를 끼워서 사용해서 스크래치 하나 없습니다.

포함 구성품:
- 아이패드 프로 본체
- 정품 충전기 및 케이블
- 애플 펜슬 2세대
- 가죽 케이스 (갈색)

직거래 선호하며, 택배 거래도 가능합니다.
궁금하신 점 있으시면 채팅 주세요!`,
    location: '강남구 역삼동',
    timeAgo: '1시간 전',
    views: 234,
    likes: 12,
    chatCount: 5,
    seller: defaultSeller,
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-50 flex items-center justify-between border-b bg-background/95 backdrop-blur px-4 h-14">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => onNavigate('home')}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleStatusChange('available')}>
                판매중으로 변경
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('reserved')}>
                예약중으로 변경
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('sold')}>
                판매완료로 변경
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                수정
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                삭제
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={() => window.open('https://www.police.go.kr/www/security/cyber.jsp', '_blank')}
              >
                신고하기
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="md:container md:mx-auto md:max-w-4xl">
        {/* Image Carousel */}
        <div className="relative aspect-square bg-muted md:rounded-xl md:mt-4 md:overflow-hidden">
          <ImageWithFallback
            src={product.images[currentImageIndex]}
            alt={product.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute bottom-4 right-4 rounded-full bg-black/60 px-3 py-1 text-white text-sm">
            {currentImageIndex + 1} / {product.images.length}
          </div>
          {product.images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {product.images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`h-2 w-2 rounded-full transition-all ${
                    index === currentImageIndex ? 'bg-white w-6' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Seller Info */}
        <div className="bg-card border-b px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={product.seller.image} />
                <AvatarFallback>{product.seller.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span>{product.seller.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    ⭐ {product.seller.rating}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  거래 후기 {product.seller.reviewCount}개
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onNavigate('seller-profile', product.seller.id)}
            >
              프로필 보기
            </Button>
          </div>
        </div>

        {/* Product Info */}
        <div className="bg-card px-4 py-6">
          <h1 className="mb-2">{product.title}</h1>
          <p className="text-sm text-muted-foreground mb-4">
            {product.category} · {product.timeAgo}
          </p>
          <div className="text-2xl mb-4">{product.price.toLocaleString()}원</div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              조회 {product.views}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              관심 {product.likes}
            </span>
            <span>채팅 {product.chatCount}</span>
          </div>
        </div>

        <Separator />

        {/* Description */}
        <div className="bg-card px-4 py-6">
          <h3 className="mb-3">상품 설명</h3>
          <p className="whitespace-pre-line text-muted-foreground">
            {product.description}
          </p>
        </div>

        <Separator />

        {/* Location */}
        <div className="bg-card px-4 py-6">
          <h3 className="mb-3">거래 희망 장소</h3>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{product.location}</span>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-50 border-t bg-background p-4 md:max-w-4xl md:mx-auto">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={handleToggleFavorite}
          >
            <Heart className={`h-6 w-6 ${isLiked ? 'fill-accent text-accent' : ''}`} />
          </Button>
          <Button 
            className="flex-1 bg-primary hover:bg-primary-hover"
            onClick={() => {
              if (realProduct) {
                const chatId = findOrCreateChat(productId, realProduct, product.seller);
                onNavigate('chat', chatId);
              }
            }}
          >
            채팅하기
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>상품 삭제 확인</AlertDialogTitle>
            <AlertDialogDescription>
              이 상품을 삭제하시겠습니까? 삭제된 상품은 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}