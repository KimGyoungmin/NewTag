import { ChevronRight, Settings, Heart, Package, ShoppingBag, Star, Bell, HelpCircle, FileText, ArrowLeft, Trash2, MoreVertical, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import { ProductCard } from "../components/ProductCard";
import { MyProductCard } from "../components/MyProductCard";
import { ProfileEditDialog } from "../components/ProfileEditDialog";
import { ReviewDialog } from "../components/ReviewDialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useState, useEffect } from "react";
import {
  getUserProfile,
  setUserProfile,
  getFavorites,
  getProductStatus,
  setProductStatus,
  deleteProduct,
  isProductDeleted,
  ProductStatus,
  getAllProducts,
  getRegisteredProducts,
  getTimeAgo,
  toggleProductVisibility,
  isProductHidden,
  getSaleHistory,
} from "../utils/localStorage";
import { authApi } from "../api/auth";
import { toast } from "sonner";

interface MyPageProps {
  onNavigate: (page: string, productId?: string) => void;
}

export function MyPage({ onNavigate }: MyPageProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [userProfile, setUserProfileState] = useState(getUserProfile());
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(getFavorites());
  const [productStatuses, setProductStatuses] = useState<Record<string, ProductStatus>>({});
  const [dateFilter, setDateFilter] = useState<'all' | '1month' | '3months' | '6months' | '1year'>('all');
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Load product statuses on mount
  useEffect(() => {
    const statuses: Record<string, ProductStatus> = {};
    myProducts.forEach(product => {
      statuses[product.id] = getProductStatus(product.id);
    });
    setProductStatuses(statuses);
  }, []);

  // Update favorites count
  useEffect(() => {
    setFavoriteIds(getFavorites());
  }, [activeSection]);

  const handleProfileSave = (profile: typeof userProfile) => {
    setUserProfile(profile);
    setUserProfileState(profile);
  };

  const handleStatusChange = (productId: string, newStatus: ProductStatus) => {
    setProductStatus(productId, newStatus);
    setProductStatuses(prev => ({
      ...prev,
      [productId]: newStatus
    }));
  };

  const handleDeleteProduct = (productId: string) => {
    deleteProduct(productId);
    setProductToDelete(null);
    // Force re-render
    setProductStatuses(prev => ({ ...prev }));
  };

  const handleLogoutConfirm = () => {
    authApi.logout();
    toast.success("로그아웃되었습니다.");
    setShowLogoutDialog(false);
    onNavigate('login');
  };

  // Mock data
  const user = {
    name: '김철수',
    image: 'https://images.unsplash.com/photo-1640960543409-dbe56ccc30e2?w=200',
    rating: 4.8,
    reviewCount: 23,
    location: '강남구 역삼동',
  };

  // 내가 등록한 상품 (실제 데이터)
  const myProductsList = getRegisteredProducts().filter(p => !isProductDeleted(p.id));
  const myProducts = myProductsList.map(p => ({
    ...p,
    timeAgo: getTimeAgo(p.createdAt),
  }));

  // 찜한 상품 (실제 데이터)
  const allProducts = getAllProducts();
  const wishlistItems = allProducts.filter(p => favoriteIds.includes(p.id)).map(p => ({
    ...p,
    timeAgo: getTimeAgo(p.createdAt),
  }));

  // 구매 내역 데이터
  const purchaseHistory = [
    {
      id: '7',
      image: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400',
      title: '맥북 에어 M1',
      price: 950000,
      location: '강남구 삼성동',
      timeAgo: '3일 전',
      likes: 0,
      chatCount: 0,
      status: 'sold' as const,
      purchaseDate: '2025.11.03',
    },
    {
      id: '8',
      image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400',
      title: '에어팟 프로 2세대',
      price: 210000,
      location: '서초구 서초동',
      timeAgo: '1주일 전',
      likes: 0,
      chatCount: 0,
      status: 'sold' as const,
      purchaseDate: '2025.10.30',
    },
    {
      id: '9',
      image: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=400',
      title: '아이폰 14 Pro',
      price: 850000,
      location: '강남구 논현동',
      timeAgo: '2주일 전',
      likes: 0,
      chatCount: 0,
      status: 'sold' as const,
      purchaseDate: '2025.10.23',
    },
  ];

  // 받은 후기 데이터
  const reviews = [
    {
      id: '1',
      reviewer: '박민수',
      reviewerImage: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200',
      rating: 5,
      comment: '친절하시고 물건 상태도 완벽했어요! 좋은 거래 감사합니다.',
      productTitle: '아이패드 프로 11인치',
      date: '2025.11.04',
    },
    {
      id: '2',
      reviewer: '최지혜',
      reviewerImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
      rating: 5,
      comment: '설명한 것과 동일하고 깨끗하게 사용하신 흔적이 보여요. 추천합니다!',
      productTitle: '북유럽 스타일 원목 책상',
      date: '2025.11.01',
    },
    {
      id: '3',
      reviewer: '이준호',
      reviewerImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      rating: 4,
      comment: '빠른 응답과 배송 감사합니다. 잘 사용하겠습니다.',
      productTitle: '맥북 프로 13인치',
      date: '2025.10.28',
    },
    {
      id: '4',
      reviewer: '강서윤',
      reviewerImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
      rating: 5,
      comment: '매너 좋으시고 가격도 합리적이에요. 또 거래하고 싶습니다!',
      productTitle: '소니 헤드폰',
      date: '2025.10.25',
    },
  ];

  const menuItems = [
    { icon: Heart, label: '관심 목록', count: wishlistItems.length, id: 'wishlist' },
    { icon: ShoppingBag, label: '구매 내역', count: purchaseHistory.length, id: 'purchase' },
    { icon: Star, label: '받은 후기', count: reviews.length, id: 'reviews' },
  ];

  const settingItems = [
    { icon: Bell, label: '알림 설정' },
    { icon: HelpCircle, label: '고객센터' },
    { icon: FileText, label: '이용약관' },
    { icon: Settings, label: '설정' },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      {/* Header */}
      <div className="border-b bg-background">
        {activeSection && (
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setActiveSection(null)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1>
                {activeSection === 'wishlist' && '관심 목록'}
                {activeSection === 'purchase' && '구매 내역'}
                {activeSection === 'reviews' && '받은 후기'}
              </h1>
            </div>
          </div>
        )}
      </div>

      <div className="container mx-auto max-w-4xl">
        {/* 관심 목록 섹션 */}
        {activeSection === 'wishlist' && (
          <div className="bg-card px-4 py-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {wishlistItems.map((product) => (
                <ProductCard
                  key={product.id}
                  {...product}
                  onClick={() => onNavigate('detail')}
                />
              ))}
            </div>
            {wishlistItems.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                관심 목록이 비어있습니다
              </div>
            )}
          </div>
        )}

        {/* 구매 내역 섹션 */}
        {activeSection === 'purchase' && (
          <div className="bg-card">
            <div className="px-4 py-4">
              <Select onValueChange={setDateFilter} value={dateFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="기간 선택">
                    {dateFilter === 'all' && '전체'}
                    {dateFilter === '1month' && '1개월'}
                    {dateFilter === '3months' && '3개월'}
                    {dateFilter === '6months' && '6개월'}
                    {dateFilter === '1year' && '1년'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="1month">1개월</SelectItem>
                  <SelectItem value="3months">3개월</SelectItem>
                  <SelectItem value="6months">6개월</SelectItem>
                  <SelectItem value="1year">1년</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {purchaseHistory.map((item) => (
              <div key={item.id} className="px-4 py-4 border-b last:border-b-0">
                <div className="flex gap-3">
                  <img 
                    src={item.image} 
                    alt={item.title}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">
                      {item.purchaseDate} 구매완료
                    </p>
                    <p className="mb-1">{item.title}</p>
                    <p className="text-emerald-600">{item.price.toLocaleString()}원</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" size="sm" onClick={() => {
                      setSelectedPurchase(item);
                      setShowReviewDialog(true);
                    }}>
                      후기 작성
                    </Button>
                    <Button variant="ghost" size="sm">
                      다시 구매
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {purchaseHistory.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                구매 내역이 없습니다
              </div>
            )}
          </div>
        )}

        {/* 받은 후기 섹션 */}
        {activeSection === 'reviews' && (
          <div className="bg-card">
            {reviews.map((review) => (
              <div key={review.id} className="px-4 py-4 border-b last:border-b-0">
                <div className="flex gap-3 mb-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={review.reviewerImage} />
                    <AvatarFallback>{review.reviewer[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{review.reviewer}</span>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{review.date}</p>
                  </div>
                </div>
                <p className="mb-2">{review.comment}</p>
                <p className="text-sm text-muted-foreground">상품: {review.productTitle}</p>
              </div>
            ))}
            {reviews.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                받은 후기가 없습니다
              </div>
            )}
          </div>
        )}

        {/* 기본 마이페이지 뷰 */}
        {!activeSection && (
          <>
            {/* Profile Section */}
            <div className="bg-card px-4 py-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user.image} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2>{user.name}</h2>
                    <Badge variant="secondary" className="text-xs">
                      ⭐ {user.rating}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {user.location}
                  </p>
                  <Button variant="outline" size="sm" onClick={() => setShowProfileEdit(true)}>
                    프로필 수정
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* Menu Items */}
            <div className="bg-card">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={item.label}>
                    <button className="flex w-full items-center justify-between px-4 py-4 transition-colors hover:bg-muted/50"
                            onClick={() => setActiveSection(item.id)}>
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <span>{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.count && (
                          <Badge variant="secondary">{item.count}</Badge>
                        )}
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </button>
                    {index < menuItems.length - 1 && <Separator />}
                  </div>
                );
              })}
            </div>

            <div className="h-2 bg-muted"></div>

            {/* My Products */}
            <div className="bg-card px-4 py-6">
              <div className="flex items-center justify-between mb-4">
                <h3>판매 중인 상품</h3>
                <Button variant="link" size="sm">
                  전체보기
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {myProducts.filter(p => !isProductDeleted(p.id)).map((product) => (
                  <MyProductCard
                    key={product.id}
                    {...product}
                    status={productStatuses[product.id] || product.status}
                    isHidden={isProductHidden(product.id)}
                    onClick={() => onNavigate('detail', product.id)}
                    onEdit={(id) => onNavigate('product-edit', id)}
                    onStatusChange={handleStatusChange}
                    onDelete={setProductToDelete}
                    onToggleVisibility={(id) => {
                      toggleProductVisibility(id);
                      setProductStatuses(prev => ({ ...prev }));
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="h-2 bg-muted"></div>

            {/* Settings */}
            <div className="bg-card">
              {settingItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={item.label}>
                    <button className="flex w-full items-center justify-between px-4 py-4 transition-colors hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </button>
                    {index < settingItems.length - 1 && <Separator />}
                  </div>
                );
              })}
            </div>

            <div className="px-4 py-8 text-center">
              <Button
                variant="outline"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => setShowLogoutDialog(true)}
              >
                로그아웃
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Profile Edit Dialog */}
      <ProfileEditDialog
        open={showProfileEdit}
        onClose={() => setShowProfileEdit(false)}
        onSave={handleProfileSave}
        profile={userProfile}
      />

      {/* Delete Product Confirmation Dialog */}
      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>상품 삭제 확인</AlertDialogTitle>
            <AlertDialogDescription>
              이 상품을 삭제하시겠습니까? 삭제된 상품은 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProductToDelete(null)}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => productToDelete && handleDeleteProduct(productToDelete)}>
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Review Dialog */}
      <ReviewDialog
        open={showReviewDialog}
        onClose={() => {
          setShowReviewDialog(false);
          setSelectedPurchase(null);
        }}
        productId={selectedPurchase?.id || ''}
        productTitle={selectedPurchase?.title || ''}
        sellerName="판매자"
        sellerImage="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200"
      />

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>로그아웃</AlertDialogTitle>
            <AlertDialogDescription>
              정말 로그아웃하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowLogoutDialog(false)}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleLogoutConfirm}>
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}