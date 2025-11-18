import { useState, useEffect } from "react";
import { ChevronLeft, MoreVertical, Heart, MapPin, Eye, Share2, AlertCircle, Star } from "lucide-react";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Skeleton } from "../components/ui/skeleton";
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
import { productApi } from "../api/productApi";
import { reviewApi } from "../api/reviewApi";
import { favoriteApi } from "../api/favoriteApi";
import { authApi } from "../api/auth";
import { toast } from "sonner";
import type { Product, ProductStatus, Review } from "../types";
import { API_BASE_URL } from "../constants";

interface ProductDetailPageProps {
  productId: string;
  onNavigate: (page: string, id?: string) => void;
}

export function ProductDetailPage({ productId, onNavigate }: ProductDetailPageProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // 현재 로그인한 사용자가 상품 소유자인지 확인
  const currentUser = authApi.getCurrentUser();
  const isOwner = product?.seller?.nick === currentUser?.nick;

  // 상품 데이터 로드
  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await productApi.getById(Number(productId));
        if (data) {
          setProduct(data);
          // likedByMe 필드 사용 (백엔드에서 제공)
          setIsLiked(data.likedByMe || false);

          // 판매자 리뷰 로드
          if (data.seller?.id) {
            loadSellerReviews(data.seller.id);
          }
        } else {
          setError("상품을 찾을 수 없습니다.");
        }
      } catch (err) {
        console.error('Failed to load product:', err);
        setError("상품을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  // 판매자 리뷰 로드
  const loadSellerReviews = async (sellerId: number) => {
    setReviewsLoading(true);
    try {
      const response = await reviewApi.getUserReviews(sellerId, { page: 0, size: 5 });
      setReviews(response.content);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  // 상태 변경 핸들러
  const handleStatusChange = async (newStatus: ProductStatus) => {
    if (!product) return;

    try {
      const updated = await productApi.updateStatus(product.id, newStatus);
      if (updated) {
        setProduct(updated);
      } else {
        setProduct({ ...product, status: newStatus });
      }
      toast.success("상태가 변경되었습니다.");
    } catch (error) {
      toast.error("상태 변경에 실패했습니다.");
    }
  };

  // 삭제 핸들러
  const handleDelete = async () => {
    if (!product) return;

    try {
      const success = await productApi.delete(product.id);
      if (success) {
        toast.success("상품이 삭제되었습니다.");
        onNavigate('home');
      } else {
        toast.error("상품 삭제에 실패했습니다.");
      }
    } catch (error) {
      toast.error("상품 삭제 중 오류가 발생했습니다.");
    }
  };

  // 찜하기 핸들러
  const handleToggleFavorite = async () => {
    if (!product) return;

    const currentUser = authApi.getCurrentUser();
    if (!currentUser) {
      toast.error("로그인이 필요합니다.");
      onNavigate('login');
      return;
    }

    const userId = currentUser.id;

    try {
      const response = await favoriteApi.toggleFavorite(product.id, userId);
      setIsLiked(response.isFavorited);

      // 상품 정보의 favoriteCount도 업데이트
      if (product) {
        setProduct({
          ...product,
          favoriteCount: response.favoriteCount,
        });
      }

      toast.success(response.message || (response.isFavorited ? "찜 목록에 추가되었습니다." : "찜하기가 취소되었습니다."));
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      toast.error("찜하기 처리 중 오류가 발생했습니다.");
    }
  };

  // 공유하기 핸들러
  const handleShare = async () => {
    if (!product) return;

    const shareData = {
      title: product.title,
      text: `${product.title} - ${product.price.toLocaleString()}원`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("링크가 복사되었습니다.");
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  // 채팅하기 핸들러
  const handleChat = () => {
    if (!product) return;
    // TODO: 실제 채팅방 생성 로직 구현
    toast.info("채팅 기능은 곧 제공됩니다.");
    // onNavigate('chatroom', chatId);
  };

  // 시간 경과 표시
  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "방금 전";
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월 전`;
    return `${Math.floor(diffDays / 365)}년 전`;
  };

  // 상태 배지 렌더링
  const renderStatusBadge = (status: ProductStatus) => {
    switch (status) {
      case 'ON_SELL':
        return <Badge className="bg-green-500">판매중</Badge>;
      case 'RESERVED':
        return <Badge className="bg-yellow-500">예약중</Badge>;
      case 'SOLD_OUT':
        return <Badge className="bg-gray-500">판매완료</Badge>;
      default:
        return null;
    }
  };

  // 이미지 URL 생성 헬퍼
  const getFullImageUrl = (path: string | undefined) => {
    console.log(path);
    if (!path) {
      return '/p_default_img.png'; // 기본 이미지
    }
    // 이미 전체 URL인 경우 그대로 반환
    if (path.startsWith('http') || path.startsWith('/')) {
      return path;
    }
    // 상대 경로인 경우 전체 URL 구성
    // API_BASE_URL = http://localhost:8081/api/v1 이므로 /static/만 추가
    return `${API_BASE_URL}/static/${path}`;
  };

  // 스와이프 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    const images = product?.images && product.images.length > 0
      ? product.images.map((img: any) => getFullImageUrl(img.pImg || img.pimg))
      : [getFullImageUrl(undefined)];

    if (isLeftSwipe && currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
    if (isRightSwipe && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }

    // 초기화
    setTouchStart(0);
    setTouchEnd(0);
  };

  // displayImages 배열 생성
  const displayImages = product?.images && product.images.length > 0
    ? product.images.map((img: any) => getFullImageUrl(img.pImg || img.pimg))
    : [getFullImageUrl(undefined)];

  // 로딩 상태
  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-8">
        <div className="sticky top-0 z-50 flex items-center justify-between border-b bg-background/95 backdrop-blur px-4 h-14">
          <Button variant="ghost" size="icon" onClick={() => onNavigate('home')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>
        <div className="md:container md:mx-auto md:max-w-4xl">
          <Skeleton className="aspect-square w-full md:rounded-xl md:mt-4" />
          <div className="p-4 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error || !product) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-8">
        <div className="sticky top-0 z-50 flex items-center justify-between border-b bg-background/95 backdrop-blur px-4 h-14">
          <Button variant="ghost" size="icon" onClick={() => onNavigate('home')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
          <AlertCircle className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold">{error || "상품을 찾을 수 없습니다"}</h2>
          <Button onClick={() => onNavigate('home')}>홈으로 돌아가기</Button>
        </div>
      </div>
    );
  }

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
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
          >
            <Share2 className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* 소유자만 볼 수 있는 메뉴 */}
              {isOwner && (
                <>
                  <DropdownMenuItem onClick={() => handleStatusChange('ON_SELL')}>
                    판매중으로 변경
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange('RESERVED')}>
                    예약중으로 변경
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange('SOLD_OUT')}>
                    판매완료로 변경
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onNavigate('product-edit', product.id.toString())}>
                    수정
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    삭제
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {/* 모든 사용자가 볼 수 있는 신고하기 */}
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
        <div
          className="relative aspect-square bg-muted md:rounded-xl md:mt-4 md:overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <ImageWithFallback
            src={displayImages[currentImageIndex]}
            alt={product.title}
            className="h-full w-full object-cover"
          />

          {displayImages.length > 1 && (
            <>
              <div className="absolute bottom-4 right-4 rounded-full bg-black/60 px-3 py-1 text-white text-sm">
                {currentImageIndex + 1} / {displayImages.length}
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {displayImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`h-2 w-2 rounded-full transition-all ${
                      index === currentImageIndex ? 'bg-white w-6' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Seller Info */}
        {product.seller && (
          <div className="bg-card border-b px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={getFullImageUrl(product.seller.profileImg)} />
                  <AvatarFallback>{product.seller.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{product.seller.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      신뢰도 {product.seller.trust}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    @{product.seller.nick}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('seller-profile', product.seller!.id.toString())}
              >
                프로필 보기
              </Button>
            </div>

            {/* 판매자 평점 정보 */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">
                  {product.seller.sellerRatingAvg?.toFixed(1) || '0.0'}
                </span>
                <span className="text-muted-foreground">
                  ({product.seller.sellerRatingCount || 0}개 리뷰)
                </span>
              </div>
              <Badge variant="outline" className="text-xs">
                {product.seller.sellerGrade || '새내기'}
              </Badge>
            </div>
          </div>
        )}

        {/* Product Info */}
        <div className="bg-card px-4 py-6">
          <div className="flex items-start justify-between mb-2">
            <h1 className="text-2xl font-bold flex-1">{product.title}</h1>
            {renderStatusBadge(product.status)}
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            {product.category?.categoryNm} · {getTimeAgo(product.createdAt)}
          </p>

          <div className="text-2xl font-bold mb-4">
            {product.price.toLocaleString()}원
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              조회 {product.viewCount}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              관심 {product.favoriteCount || 0}
            </span>
          </div>
        </div>

        <Separator />

        {/* Description */}
        <div className="bg-card px-4 py-6">
          <h3 className="text-lg font-semibold mb-3">상품 설명</h3>
          <p className="whitespace-pre-line text-muted-foreground leading-relaxed">
            {product.content}
          </p>
        </div>

        <Separator />

        {/* Location */}
        <div className="bg-card px-4 py-6">
          <h3 className="text-lg font-semibold mb-3">거래 희망 장소</h3>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{product.locationNm}</span>
          </div>
          {/* TODO: 지도 컴포넌트 추가 */}
        </div>

        <Separator />

        {/* Seller Reviews Section */}
        {product.seller && (
          <div className="bg-card px-4 py-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">판매자 리뷰</h3>
              {product.seller.sellerRatingCount && product.seller.sellerRatingCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate('seller-profile', product.seller!.id.toString())}
                >
                  전체보기
                </Button>
              )}
            </div>

            {reviewsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={getFullImageUrl(review.writerProfileImg)} />
                        <AvatarFallback>{review.writerName?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{review.writerName}</span>
                          <div className="flex items-center">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {getTimeAgo(review.createdAt)}
                        </p>
                      </div>
                    </div>
                    {review.content && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {review.content}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                아직 리뷰가 없습니다.
              </p>
            )}
          </div>
        )}

        <Separator />

        {/* Related Products Section - TODO */}
        <div className="bg-card px-4 py-6">
          <h3 className="text-lg font-semibold mb-3">이 상품과 비슷한 상품</h3>
          <p className="text-sm text-muted-foreground">관련 상품을 준비 중입니다.</p>
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
            <Heart className={`h-6 w-6 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
          <Button
            className="flex-1 bg-primary hover:bg-primary/90"
            onClick={handleChat}
            disabled={product.status === 'SOLD_OUT'}
          >
            {product.status === 'SOLD_OUT' ? '판매완료' : '채팅하기'}
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
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
