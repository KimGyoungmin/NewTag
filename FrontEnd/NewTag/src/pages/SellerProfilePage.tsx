import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, MapPin, Star, Shield } from "lucide-react";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { ProductCard } from "../components/ProductCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { sellerApi } from "../api/sellerApi";
import { reviewApi } from "../api/reviewApi";
import { resolveImageUrl } from "../utils/image";

interface SellerProfilePageProps {
  sellerId: string;
  onNavigate: (page: string, id?: string) => void;
}

export function SellerProfilePage({ sellerId, onNavigate }: SellerProfilePageProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof sellerApi.getSellerProfile>>>(null);
  const [ratingSummary, setRatingSummary] = useState<{ averageRating: number; totalCount: number } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const data = await sellerApi.getSellerProfile(Number(sellerId));
      if (data) {
        setProfile(data);
      }
      const summary = await reviewApi.getRatingSummary(Number(sellerId));
      setRatingSummary({ averageRating: summary.averageRating, totalCount: summary.totalCount });
      setLoading(false);
    };

    if (sellerId) {
      fetchProfile();
    }
  }, [sellerId]);

  const seller = useMemo(() => profile?.seller, [profile]);
  const sellerProducts = useMemo(() => profile?.products ?? [], [profile]);
  const activeProducts = sellerProducts.filter((p) => p.status !== "SOLD_OUT");
  const soldProducts = sellerProducts.filter((p) => p.status === "SOLD_OUT");

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 flex items-center justify-between border-b bg-background px-4 h-14">
        <Button variant="ghost" size="icon" onClick={() => onNavigate("home")}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2>판매자 프로필</h2>
        <div className="w-10"></div>
      </div>

      <div className="container mx-auto max-w-4xl">
        {loading || !seller ? (
          <div className="p-6 text-center text-muted-foreground">판매자 정보를 불러오는 중...</div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Profile Header */}
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={resolveImageUrl(seller.profileImg)} alt={seller.name} />
                <AvatarFallback>{seller.name?.[0] ?? "U"}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                    <h3>{seller.name}</h3>
                    <Badge variant="secondary" className="gap-1">
                      <Shield className="h-3 w-3" />
                      인증
                    </Badge>
                </div>
                <div className="text-sm text-muted-foreground mb-3">@{seller.nick}</div>
                <div className="flex gap-2">
                  <Button
                    variant={isFollowing ? "outline" : "default"}
                    size="sm"
                    onClick={() => setIsFollowing(!isFollowing)}
                    className={isFollowing ? "" : "bg-primary hover:bg-primary-hover"}
                  >
                    {isFollowing ? "팔로잉" : "팔로우"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onNavigate("chat")}>
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
                  <span>{(ratingSummary?.averageRating ?? 0).toFixed(1)}</span>
                </div>
                <p className="text-xs text-muted-foreground">평점</p>
              </div>
              <div className="text-center">
                <div className="mb-1">{profile?.totalProducts ?? 0}</div>
                <p className="text-xs text-muted-foreground">등록 상품</p>
              </div>
              <div className="text-center">
                <div className="mb-1">{ratingSummary?.totalCount ?? 0}</div>
                <p className="text-xs text-muted-foreground">리뷰 수</p>
              </div>
              <div className="text-center">
                <div className="mb-1">{seller.trust ?? 0}</div>
                <p className="text-xs text-muted-foreground">신뢰도</p>
              </div>
            </div>

            <Separator />

            {/* Products Tabs */}
            <Tabs defaultValue="on-sale" className="w-full">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="on-sale">판매중</TabsTrigger>
                <TabsTrigger value="sold">거래완료</TabsTrigger>
              </TabsList>
              <TabsContent value="on-sale" className="pt-4">
                {activeProducts.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {activeProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        id={String(product.id)}
                        image={resolveImageUrl(product.thumbnailImage || product.mainImage)}
                        title={product.title}
                        price={product.price}
                        location={product.locationNm || ""}
                        timeAgo={product.timeAgo || ""}
                        likes={product.favoriteCount || 0}
                        chatCount={0}
                        status={product.status === "RESERVED" ? "reserved" : "available"}
                        sellerNick={product.seller?.nick}
                        onClick={() => onNavigate("detail", String(product.id))}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">판매중인 상품이 없습니다.</p>
                )}
              </TabsContent>
              <TabsContent value="sold" className="pt-4">
                {soldProducts.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {soldProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        id={String(product.id)}
                        image={resolveImageUrl(product.thumbnailImage || product.mainImage)}
                        title={product.title}
                        price={product.price}
                        location={product.locationNm || ""}
                        timeAgo={product.timeAgo || ""}
                        likes={product.favoriteCount || 0}
                        chatCount={0}
                        status="sold"
                        sellerNick={product.seller?.nick}
                        onClick={() => onNavigate("detail", String(product.id))}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">거래완료된 상품이 없습니다.</p>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}

