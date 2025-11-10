import { useState } from "react";
import { ChevronLeft, MapPin, Star, Package, ThumbsUp, Shield } from "lucide-react";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { ProductCard } from "../components/ProductCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

interface SellerProfilePageProps {
  sellerId: string;
  onNavigate: (page: string, id?: string) => void;
}

export function SellerProfilePage({ sellerId, onNavigate }: SellerProfilePageProps) {
  const [isFollowing, setIsFollowing] = useState(false);

  // Mock seller data
  const seller = {
    id: sellerId,
    name: '김민수',
    profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
    location: '강남구 역삼동',
    rating: 4.8,
    totalSales: 127,
    responseRate: 98,
    joinDate: '2023년 3월',
    followers: 234,
    isVerified: true,
  };

  // Mock seller's products
  const sellerProducts = [
    {
      id: '1',
      image: 'https://images.unsplash.com/photo-1758186355698-bd0183fc75ed?w=400',
      title: '아이패드 프로 11인치 M2칩',
      price: 850000,
      location: '강남구 역삼동',
      timeAgo: '1일 전',
      likes: 12,
      chatCount: 5,
      status: 'available' as const,
      category: 'electronics'
    },
    {
      id: '2',
      image: 'https://images.unsplash.com/photo-1634824506573-4a430d1d6111?w=400',
      title: '북유럽 스타일 원목 책상',
      price: 120000,
      location: '강남구 역삼동',
      timeAgo: '3일 전',
      likes: 8,
      chatCount: 3,
      status: 'available' as const,
      category: 'furniture'
    },
    {
      id: '3',
      image: 'https://images.unsplash.com/photo-1687253946687-a3713aa25b2f?w=400',
      title: '겨울 패딩 점퍼',
      price: 65000,
      location: '강남구 역삼동',
      timeAgo: '5일 전',
      likes: 23,
      chatCount: 11,
      status: 'sold' as const,
      category: 'fashion'
    },
    {
      id: '4',
      image: 'https://images.unsplash.com/photo-1580234797602-22c37b2a6230?w=400',
      title: 'PS5 디지털 에디션',
      price: 380000,
      location: '강남구 역삼동',
      timeAgo: '1주 전',
      likes: 18,
      chatCount: 9,
      status: 'sold' as const,
      category: 'electronics'
    },
  ];

  // Mock reviews
  const reviews = [
    {
      id: '1',
      buyerName: '박지영',
      buyerImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      rating: 5,
      comment: '친절하시고 물건도 깨끗해요! 좋은 거래였습니다.',
      productTitle: '아이패드 프로 11인치',
      date: '2024년 10월',
    },
    {
      id: '2',
      buyerName: '이준호',
      buyerImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      rating: 5,
      comment: '설명과 똑같고 빠른 응답 감사합니다!',
      productTitle: '북유럽 스타일 원목 책상',
      date: '2024년 9월',
    },
    {
      id: '3',
      buyerName: '최서연',
      buyerImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
      rating: 4,
      comment: '좋은 상품 감사합니다.',
      productTitle: '겨울 패딩 점퍼',
      date: '2024년 9월',
    },
  ];

  const activeProducts = sellerProducts.filter(p => p.status === 'available');
  const soldProducts = sellerProducts.filter(p => p.status === 'sold');

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 flex items-center justify-between border-b bg-background px-4 h-14">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => onNavigate('detail')}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2>판매자 프로필</h2>
        <div className="w-10"></div>
      </div>

      <div className="container mx-auto max-w-4xl">
        {/* Profile Section */}
        <div className="p-6 space-y-6">
          {/* Profile Header */}
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={seller.profileImage} alt={seller.name} />
              <AvatarFallback>{seller.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3>{seller.name}</h3>
                {seller.isVerified && (
                  <Badge variant="secondary" className="gap-1">
                    <Shield className="h-3 w-3" />
                    인증
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                <MapPin className="h-4 w-4" />
                <span>{seller.location}</span>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant={isFollowing ? "outline" : "default"}
                  size="sm"
                  onClick={() => setIsFollowing(!isFollowing)}
                  className={isFollowing ? "" : "bg-primary hover:bg-primary-hover"}
                >
                  {isFollowing ? '팔로잉' : '팔로우'}
                </Button>
                <Button variant="outline" size="sm">
                  문의하기
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="h-4 w-4 fill-primary text-primary" />
                <span>{seller.rating}</span>
              </div>
              <p className="text-xs text-muted-foreground">평점</p>
            </div>
            <div className="text-center">
              <div className="mb-1">{seller.totalSales}</div>
              <p className="text-xs text-muted-foreground">판매완료</p>
            </div>
            <div className="text-center">
              <div className="mb-1">{seller.responseRate}%</div>
              <p className="text-xs text-muted-foreground">응답률</p>
            </div>
            <div className="text-center">
              <div className="mb-1">{seller.followers}</div>
              <p className="text-xs text-muted-foreground">팔로워</p>
            </div>
          </div>

          <Separator />

          {/* Activity Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">판매 상품</span>
              <span className="ml-auto">{activeProducts.length}개</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <ThumbsUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">받은 후기</span>
              <span className="ml-auto">{reviews.length}개</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Star className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">가입일</span>
              <span className="ml-auto">{seller.joinDate}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Products & Reviews Tabs */}
        <Tabs defaultValue="selling" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="selling">판매중 {activeProducts.length}</TabsTrigger>
            <TabsTrigger value="sold">판매완료 {soldProducts.length}</TabsTrigger>
            <TabsTrigger value="reviews">후기 {reviews.length}</TabsTrigger>
          </TabsList>

          <TabsContent value="selling" className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {activeProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  {...product}
                  onClick={() => onNavigate('detail', product.id)}
                />
              ))}
            </div>
            {activeProducts.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                판매중인 상품이 없습니다
              </div>
            )}
          </TabsContent>

          <TabsContent value="sold" className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {soldProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  {...product}
                  onClick={() => onNavigate('detail', product.id)}
                />
              ))}
            </div>
            {soldProducts.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                판매완료한 상품이 없습니다
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="p-4 space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={review.buyerImage} alt={review.buyerName} />
                    <AvatarFallback>{review.buyerName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{review.buyerName}</span>
                      <span className="text-xs text-muted-foreground">{review.date}</span>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating
                              ? 'fill-primary text-primary'
                              : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-sm mb-2">{review.comment}</p>
                <p className="text-xs text-muted-foreground">구매 상품: {review.productTitle}</p>
              </div>
            ))}
            {reviews.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                받은 후기가 없습니다
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
