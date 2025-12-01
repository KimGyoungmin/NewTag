import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Settings,
  Heart,
  ShoppingBag,
  Star,
  Bell,
  HelpCircle,
  FileText,
  ArrowLeft,
} from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { api } from "../api/client";
import { favoriteApi } from "../api/favoriteApi";
import { productApi } from "../api/productApi";
import { reviewApi } from "../api/reviewApi";
import { authApi } from "../api/auth";
import { userApi } from "../api/userApi";
import { resolveImageUrl } from "../utils/image";
import {
  UserProfile,
  getUserProfile,
  isProductHidden,
  setUserProfile,
  toggleProductVisibility,
} from "../utils/localStorage";
import type { ProductStatus as ApiProductStatus, RatingSummary } from "../types";
import { toast } from "sonner";

interface MyPageProps {
  onNavigate: (page: string, productId?: string) => void;
}

type UiProductStatus = "available" | "reserved" | "sold";

interface WishlistItem {
  id: string;
  image: string;
  title: string;
  price: number;
  location: string;
  timeAgo: string;
  likes: number;
  chatCount: number;
  status: UiProductStatus;
  sellerNick?: string;
}

interface PurchaseHistoryItem {
  id: string; // transactionId
  image: string;
  title: string;
  price: number;
  purchaseDate: string;
  sellerName?: string;
  sellerNick?: string;
  sellerId?: number;
  productId?: number;
}

interface ReceivedReview {
  id: string;
  reviewer: string;
  reviewerImage?: string;
  rating: number;
  comment?: string;
  productTitle?: string;
  date: string;
}

const toUiStatus = (status?: ApiProductStatus | string | null): UiProductStatus => {
  switch (status) {
    case "RESERVED":
      return "reserved";
    case "SOLD_OUT":
      return "sold";
    default:
      return "available";
  }
};

const toApiStatus = (status: UiProductStatus): ApiProductStatus => {
  switch (status) {
    case "reserved":
      return "RESERVED";
    case "sold":
      return "SOLD_OUT";
    default:
      return "ON_SELL";
  }
};

const formatTimeAgo = (dateInput?: string | number | Date) => {
  if (!dateInput) return "";
  const now = new Date();
  const date = new Date(dateInput);
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  if (days < 365) return `${Math.floor(days / 30)}개월 전`;
  return `${Math.floor(days / 365)}년 전`;
};

const buildProfileFromAuth = (fallback?: UserProfile): UserProfile => {
  const authUser = authApi.getCurrentUser();
  if (authUser) {
    return {
      name: authUser.name || authUser.nick || fallback?.name || "사용자",
      nickname: authUser.nick || fallback?.nickname || "",
      profileImage: resolveImageUrl(authUser.profileImg),
      phone: authUser.phone || fallback?.phone || "",
      email: authUser.email || fallback?.email || "",
    };
  }
  return fallback || getUserProfile();
};

export function MyPage({ onNavigate }: MyPageProps) {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [userProfile, setUserProfileState] = useState<UserProfile>(() => buildProfileFromAuth());
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseHistoryItem | null>(null);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [myProducts, setMyProducts] = useState<WishlistItem[]>([]);
  const [myProductsLoading, setMyProductsLoading] = useState(false);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistoryItem[]>([]);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseReviewStatus, setPurchaseReviewStatus] = useState<Record<string, boolean>>({});
  const [reviews, setReviews] = useState<ReceivedReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [ratingSummary, setRatingSummary] = useState<RatingSummary | null>(null);
  const [dateFilter, setDateFilter] = useState<"all" | "1month" | "3months" | "6months" | "1year">(
    "all"
  );
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  useEffect(() => {
    const loadData = () => {
      const sessionProfile = buildProfileFromAuth(userProfile);
      setUserProfileState(sessionProfile);

      const userId = authApi.getCurrentUser()?.id;
      if (!userId) {
        setWishlistItems([]);
        setMyProducts([]);
        setPurchaseHistory([]);
        setReviews([]);
        setRatingSummary(null);
        return;
      }

      fetchWishlist(userId);
      fetchMyProducts(userId);
      fetchPurchaseHistory();
      fetchReviews(userId);
      fetchRatingSummary(userId);
    };

    loadData();
    window.addEventListener("auth-change", loadData);
    return () => window.removeEventListener("auth-change", loadData);
  }, []);

  const fetchWishlist = async (userId: number) => {
    setWishlistLoading(true);
    try {
      const productIds = await favoriteApi.getMyFavoriteProducts(userId);
      const products = await Promise.all(
        productIds.map(async (id) => {
          const detail = await productApi.getById(id, userId);
          if (!detail) return null;
          return {
            id: detail.id.toString(),
            image: resolveImageUrl(detail.thumbnailImage ?? detail.mainImage),
            title: detail.title,
            price: detail.price,
            location: detail.locationNm,
            timeAgo: formatTimeAgo(detail.createdAt),
            likes: detail.favoriteCount ?? 0,
            chatCount: detail.viewCount,
            status: toUiStatus(detail.status),
            sellerNick: detail.seller?.nick,
          } as WishlistItem;
        })
      );

      setWishlistItems(products.filter(Boolean) as WishlistItem[]);
    } catch (error) {
      console.error("Failed to load wishlist:", error);
      setWishlistItems([]);
    } finally {
      setWishlistLoading(false);
    }
  };

  const fetchMyProducts = async (userId: number) => {
    setMyProductsLoading(true);
    try {
      const response = await api.get(`/products/seller/${userId}`, {
        params: { page: 0, size: 50 },
      });
      const listItems: any[] = response.data?.products ?? [];

      const products = await Promise.all(
        listItems.map(async (item) => {
          const detail = await productApi.getById(Number(item.id), userId);
          const image =
            item.thumbnailImage ??
            item.mainImage ??
            detail?.thumbnailImage ??
            detail?.mainImage;

          return {
            id: String(item.id ?? detail?.id),
            image: resolveImageUrl(image),
            title: item.title ?? detail?.title ?? "상품",
            price: Number(item.price ?? detail?.price ?? 0),
            location: item.locationNm ?? detail?.locationNm ?? "",
            timeAgo: item.timeAgo ?? formatTimeAgo(detail?.createdAt),
            likes: Number(item.favoriteCount ?? detail?.favoriteCount ?? 0),
            chatCount: Number(item.viewCount ?? detail?.viewCount ?? 0),
            status: toUiStatus(detail?.status),
            sellerNick: detail?.seller?.nick,
          } as WishlistItem;
        })
      );

      const filtered = products
        .filter((p) => p && p.id)
        // 판매 완료(SOLD_OUT) 상품은 제외
        .filter((p) => p.status !== "sold") as WishlistItem[];
      setMyProducts(filtered);
    } catch (error) {
      console.error("Failed to load my products:", error);
      setMyProducts([]);
    } finally {
      setMyProductsLoading(false);
    }
  };

  const fetchPurchaseHistory = async () => {
    const currentUser = authApi.getCurrentUser();
    if (!currentUser?.id) {
      setPurchaseHistory([]);
      return;
    }

    setPurchaseLoading(true);
    try {
      const response = await api.get("/purchase");
      const items: any[] = response.data?.purchases ?? [];
      const mapped = items.map((item) => ({
        id: String(item.transactionId ?? item.id ?? Date.now()),
        image: resolveImageUrl(
          item.productImage || item.thumbnailImage || item.mainImage
        ),
        title: item.productTitle || item.title || "?? ??",
        price: Number(item.price ?? 0),
        purchaseDate: item.transactionAt
          ? new Date(item.transactionAt).toLocaleDateString("ko-KR")
          : new Date().toLocaleDateString("ko-KR"),
        sellerName: item.sellerNick || item.partnerNick || item.sellerName,
        sellerNick: item.sellerNick || item.partnerNick,
        sellerId: item.sellerId,
        productId: item.productId,
      }));
      setPurchaseHistory(mapped);
    } catch (error) {
      console.error("Failed to load purchase history:", error);
      setPurchaseHistory([]);
    } finally {
      setPurchaseLoading(false);
    }
  };

  // 구매 내역에 대한 리뷰 작성 여부 확인 (중복 방지)
  useEffect(() => {
    const checkReviews = async () => {
      const ids = purchaseHistory
        .map((p) => p.id)
        .filter((id) => purchaseReviewStatus[id] === undefined);
      if (ids.length === 0) return;

      try {
        const entries = await Promise.all(
          ids.map(async (id) => {
            const exists = await reviewApi.existsReview(Number(id));
            return [id, exists] as const;
          })
        );
        setPurchaseReviewStatus((prev) => {
          const next = { ...prev };
          for (const [id, exists] of entries) {
            next[id] = exists;
          }
          return next;
        });
      } catch (error) {
        console.error("Failed to check purchase review existence:", error);
      }
    };
    checkReviews();
  }, [purchaseHistory, purchaseReviewStatus]);

  const fetchReviews = async (userId: number) => {
    setReviewsLoading(true);
    try {
      const response = await reviewApi.getUserReviews(userId, { page: 0, size: 20 });
      const mapped: ReceivedReview[] = response.content.map((review) => ({
        id: review.id.toString(),
        reviewer: review.writerName || review.writerNick || "구매자",
        reviewerImage: resolveImageUrl(review.writerProfileImg),
        rating: review.rating,
        comment: review.content,
        productTitle: review.productTitle,
        date: new Date(review.createdAt).toLocaleDateString("ko-KR"),
      }));
      setReviews(mapped);
    } catch (error) {
      console.error("Failed to load reviews:", error);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchRatingSummary = async (userId: number) => {
    try {
      const summary = await reviewApi.getRatingSummary(userId);
      setRatingSummary(summary);
    } catch (error) {
      console.error("Failed to load rating summary:", error);
      setRatingSummary(null);
    }
  };

  const handleProfileSave = async (profile: UserProfile) => {
    try {
      const response = await userApi.updateProfile({
        name: profile.name,
        nickname: profile.nickname,
        phone: profile.phone,
        profileImage: profile.profileImage,
        email: profile.email,
      });
      const updated = {
        ...profile,
        profileImage: resolveImageUrl(response?.user?.profileImg) || profile.profileImage,
        phone: response?.user?.phone || profile.phone,
        nickname: response?.user?.nick || profile.nickname,
        name: response?.user?.name || profile.name,
        email: response?.user?.email || profile.email,
      };
      setUserProfile(updated);
      setUserProfileState(updated);
      toast.success("프로필이 수정되었습니다.");
    } catch (error) {
      console.error("Failed to update profile", error);
      toast.error("프로필 수정에 실패했습니다.");
    }
  };

  const handleStatusChange = async (productId: string, newStatus: UiProductStatus) => {
    const numericId = Number(productId);
    if (Number.isNaN(numericId)) return;

    try {
      const updated = await productApi.updateStatus(numericId, toApiStatus(newStatus));
      setMyProducts((prev) =>
        prev.map((product) =>
          product.id === productId
            ? { ...product, status: toUiStatus(updated?.status ?? toApiStatus(newStatus)) }
            : product
        )
      );
      toast.success("상품 상태를 변경했어요.");
    } catch (error) {
      console.error("Failed to update status", error);
      toast.error("상태를 변경하지 못했어요.");
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const numericId = Number(productId);
    if (Number.isNaN(numericId)) return;

    try {
      const success = await productApi.delete(numericId);
      if (success) {
        setMyProducts((prev) => prev.filter((product) => product.id !== productId));
        toast.success("상품을 삭제했어요.");
      } else {
        toast.error("상품 삭제에 실패했어요.");
      }
    } catch (error) {
      console.error("Failed to delete product", error);
      toast.error("상품 삭제 중 오류가 발생했어요.");
    } finally {
      setProductToDelete(null);
    }
  };

  const handleLogoutConfirm = async () => {
    try {
      await authApi.logout();
      toast.success("로그아웃했어요.");
    } catch (error) {
      console.error("Failed to logout", error);
      toast.error("로그아웃에 실패했어요.");
    }
    setShowLogoutDialog(false);
    onNavigate("login");
  };

  const menuItems = [
    { icon: Heart, label: "관심목록", count: wishlistItems.length, id: "wishlist" },
    { icon: ShoppingBag, label: "구매 내역", count: purchaseHistory.length, id: "purchase" },
    { icon: ShoppingBag, label: "판매 중인 상품", count: myProducts.length, id: "my-products" },
    { icon: Star, label: "받은 후기", count: reviews.length, id: "reviews" },
  ];

  const settingItems = [
    { icon: Bell, label: "알림 설정" },
    { icon: HelpCircle, label: "고객센터" },
    { icon: FileText, label: "이용약관" },
    { icon: Settings, label: "설정" },
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
                {activeSection === "wishlist" && "관심목록"}
                {activeSection === "purchase" && "구매 내역"}
                {activeSection === "my-products" && "판매 중인 상품"}
                {activeSection === "reviews" && "받은 후기"}
              </h1>
            </div>
          </div>
        )}
      </div>

      <div className="container mx-auto max-w-4xl">
        {/* 관심목록 */}
        {activeSection === "wishlist" && (
          <div className="bg-card px-4 py-6">
            {wishlistLoading ? (
              <div className="text-center py-12 text-muted-foreground">관심목록을 불러오는 중입니다...</div>
            ) : wishlistItems.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {wishlistItems.map((product) => (
                  <ProductCard
                    key={product.id}
                    {...product}
                    isLikedByMe={true}
                    onFavoriteChange={(id, isFavorited) => {
                      if (!isFavorited) {
                        setWishlistItems((prev) => prev.filter((p) => p.id !== id));
                      }
                    }}
                    onClick={() => onNavigate("detail", product.id)}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">관심목록이 비어 있습니다.</div>
            )}
          </div>
        )}

        {/* 구매 내역 */}
        {activeSection === "purchase" && (
          <div className="bg-card">
            <div className="px-4 py-4">
              <Select
                value={dateFilter}
                onValueChange={(value) => setDateFilter(value as "all" | "1month" | "3months" | "6months" | "1year")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="기간 선택">
                    {dateFilter === "all" && "전체"}
                    {dateFilter === "1month" && "1개월"}
                    {dateFilter === "3months" && "3개월"}
                    {dateFilter === "6months" && "6개월"}
                    {dateFilter === "1year" && "1년"}
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
            {purchaseLoading ? (
              <div className="text-center py-12 text-muted-foreground">구매 내역을 불러오는 중입니다...</div>
            ) : purchaseHistory.length > 0 ? (
              purchaseHistory.map((item) => (
                <div key={item.id} className="px-4 py-4 border-b last:border-b-0">
                  <div className="flex gap-3">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">
                        {item.purchaseDate} 구매 완료
                      </p>
                      <p className="mb-1">{item.title}</p>
                      <p className="text-emerald-600">{item.price.toLocaleString()}원</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-28"
                        disabled={purchaseReviewStatus[item.id] === true}
                        onClick={() => {
                          if (purchaseReviewStatus[item.id]) return;
                          const payload = {
                            transactionId: Number(item.id),
                            targetId: item.sellerId ?? undefined,
                            productId: item.productId,
                            productTitle: item.title,
                            sellerName: item.sellerName,
                            sellerNick: item.sellerNick,
                            sellerProfileImg: item.image,
                            buyerId: authApi.getCurrentUser()?.id,
                          };
                          navigate("/review-write", { state: { payload } });
                        }}
                      >
                        {purchaseReviewStatus[item.id] ? "후기 작성 완료" : "후기 작성"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-28"
                        onClick={() => item.productId && navigate(`/detail/${item.productId}`)}
                      >
                        판매글 보기
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">구매 내역이 아직 없습니다.</div>
            )}
          </div>
        )}

        {/* 판매 중인 상품 */}
        {activeSection === "my-products" && (
          <div className="bg-card px-4 py-6">
            <div className="flex items-center justify-between mb-4">
              <h3>판매 중인 상품</h3>
            </div>
            {myProductsLoading ? (
              <div className="text-center py-10 text-muted-foreground">내 상품을 불러오는 중입니다...</div>
            ) : myProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {myProducts.map((product) => (
                  <MyProductCard
                    key={product.id}
                    {...product}
                    status={product.status}
                    isHidden={isProductHidden(product.id)}
                    onClick={() => onNavigate("detail", product.id)}
                    onEdit={(id) => onNavigate("product-edit", id)}
                    onStatusChange={handleStatusChange}
                    onDelete={setProductToDelete}
                    onToggleVisibility={(id) => {
                      toggleProductVisibility(id);
                      setMyProducts((prev) => [...prev]);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">판매 중인 상품이 없습니다.</div>
            )}
          </div>
        )}

        {/* 받은 후기 */}
        {activeSection === "reviews" && (
          <div className="bg-card">
            {reviewsLoading ? (
              <div className="text-center py-12 text-muted-foreground">후기를 불러오는 중입니다...</div>
            ) : reviews.length > 0 ? (
              reviews.map((review) => (
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
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{review.date}</p>
                    </div>
                  </div>
                  {review.comment && <p className="mb-2">{review.comment}</p>}
                  {review.productTitle && (
                    <p className="text-sm text-muted-foreground">상품: {review.productTitle}</p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">받은 후기가 아직 없습니다.</div>
            )}
          </div>
        )}

        {/* 기본 마이페이지 */}
        {!activeSection && (
          <>
            {/* Profile Section */}
            <div className="bg-card px-4 py-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={userProfile.profileImage} />
                  <AvatarFallback>{userProfile.name?.[0] ?? "U"}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2>{userProfile.name}</h2>
                    <Badge variant="secondary" className="text-xs">
                      신뢰도 {ratingSummary?.averageRating?.toFixed(1) ?? "0.0"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">@{userProfile.nickname}</p>
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
                    <button
                      className="flex w-full items-center justify-between px-4 py-4 transition-colors hover:bg-muted/50"
                      onClick={() => setActiveSection(item.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <span>{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {typeof item.count === "number" && item.count > 0 && (
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

            {/* My Products (예시) */}
            {/* ... */}

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
            <AlertDialogTitle>상품 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              상품을 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다.
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
        productId={selectedPurchase?.id || ""}
        productTitle={selectedPurchase?.title || ""}
        sellerName={selectedPurchase?.sellerName || "판매자"}
        sellerImage="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200"
      />

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>로그아웃</AlertDialogTitle>
            <AlertDialogDescription>
              로그아웃하시겠습니까?
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
