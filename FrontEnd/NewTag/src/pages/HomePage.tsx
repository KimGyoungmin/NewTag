import { useState, useEffect, useRef, useCallback } from "react";
import { Plus, MapPin, ArrowUpDown, ChevronLeft } from "lucide-react";
import { ProductCard } from "../components/ProductCard";
import { CategoryFilter } from "../components/CategoryFilter";
import { Button } from "../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { productsApi } from "../api/products";
import { favoriteApi } from "../api/favoriteApi";
import { authApi } from "../api/auth";
import { resolveImageUrl } from "../utils/image";

interface HomePageProps {
  onNavigate: (page: string, productId?: string) => void;
  searchQuery?: string;
  onClearSearch?: () => void;
}

interface Product {
  id: number;
  mainImage: string;
  thumbnailImage?: string;
  title: string;
  price: number;
  locationNm: string;
  createdAt: string;
  viewCount: number;
  favoriteCount: number;
  timeAgo: string;
}

export function HomePage({ onNavigate, searchQuery = '', onClearSearch }: HomePageProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'latest' | 'price-low' | 'price-high' | 'popular'>('latest');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favoriteProductIds, setFavoriteProductIds] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // 찜한 상품 목록 불러오기
  const fetchFavorites = async (userId?: number | null) => {
    const targetUserId = userId ?? authApi.getCurrentUser()?.id;
    if (!targetUserId) {
      setFavoriteProductIds(new Set());
      return;
    }

    try {
      const productIds = await favoriteApi.getMyFavoriteProducts(targetUserId);
      setFavoriteProductIds(new Set(productIds));
    } catch (err) {
      console.error('찜 목록 조회 실패:', err);
    }
  };

  // 상품 목록 불러오기 (초기 30개)
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      setCurrentPage(0);
      setHasMore(true);

      let response;

      // 검색어가 있으면 검색 API 호출
      if (searchQuery && searchQuery.trim()) {
        const currentUser = authApi.getCurrentUser();
        const userId = currentUser?.id;

        response = await productsApi.searchProducts(
          searchQuery,
          userId,
          'WEB',
          0,
          30
        );
      } else {
        // 검색어가 없으면 일반 상품 목록 조회
        const categoryId = selectedCategory === 'all' ? undefined : parseInt(selectedCategory);

        response = await productsApi.getProducts({
          categoryId,
          sortBy,
          page: 0,
          size: 30,
        });
      }

      const newProducts = response.products || [];
      setProducts(newProducts);

      // 30개 미만이면 더 이상 로드할 데이터가 없음
      if (newProducts.length < 30) {
        setHasMore(false);
      }
    } catch (err: any) {
      console.error('상품 목록 조회 실패:', err);
      setError('상품을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 추가 상품 로드 (10개씩)
  const loadMoreProducts = async () => {
    if (!hasMore || loadingMore) return;

    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;

      let response;

      // 검색어가 있으면 검색 API 호출
      if (searchQuery && searchQuery.trim()) {
        const currentUser = authApi.getCurrentUser();
        const userId = currentUser?.id;

        response = await productsApi.searchProducts(
          searchQuery,
          userId,
          'WEB',
          nextPage,
          20
        );
      } else {
        // 검색어가 없으면 일반 상품 목록 조회
        const categoryId = selectedCategory === 'all' ? undefined : parseInt(selectedCategory);

        response = await productsApi.getProducts({
          categoryId,
          sortBy,
          page: nextPage,
          size: 20,
        });
      }

      const newProducts = response.products || [];

      if (newProducts.length > 0) {
        setProducts(prev => [...prev, ...newProducts]);
        setCurrentPage(nextPage);
      }

      // 10개 미만이면 더 이상 로드할 데이터가 없음
      if (newProducts.length < 10) {
        setHasMore(false);
      }
    } catch (err: any) {
      console.error('추가 상품 로드 실패:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // 초기 로드 시 찜 목록 불러오기 (로그인한 경우에만)
  useEffect(() => {
    const handleAuthChange = () => {
      const user = authApi.getCurrentUser();
      if (user) {
        fetchFavorites(user.id);
      } else {
        setFavoriteProductIds(new Set());
      }
    };

    handleAuthChange();
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  // 카테고리, 정렬 옵션, 검색어 변경 시 상품 목록 다시 불러오기
  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, sortBy, searchQuery]);

  // 무한 스크롤을 위한 observer ref
  const observer = useRef<IntersectionObserver | null>(null);

  const lastProductElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      // hasMore가 false면 observer를 연결하지 않음
      if (!hasMore) return;

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMoreProducts();
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore, loadMoreProducts]
  );

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      {/* Search Result Header */}
      {searchQuery && (
        <div className="border-b bg-muted/30">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClearSearch}
                  className="shrink-0 h-8 w-8"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <span className="text-sm text-muted-foreground">검색 결과:</span>
                <span className="font-medium">"{searchQuery}"</span>
                <span className="text-sm text-primary">
                  {products.length}개
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Bar */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
            <MapPin className="mr-2 h-4 w-4 text-primary" />
            <span>광주광역시 동구 동명동</span>
          </Button>

          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-auto p-0 hover:bg-transparent">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <span className="text-sm">
                  {sortBy === 'latest' && '최신순'}
                  {sortBy === 'price-low' && '가격 낮은순'}
                  {sortBy === 'price-high' && '가격 높은순'}
                  {sortBy === 'popular' && '인기순'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy('latest')}>
                최신순
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('price-low')}>
                가격 낮은순
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('price-high')}>
                가격 높은순
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('popular')}>
                인기순
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Category Filter */}
      <div className="border-b bg-background py-3">
        <CategoryFilter
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">상품을 불러오는 중...</p>
        </div>
      )}

      {error && (
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-red-500">{error}</p>
          <Button onClick={fetchProducts} className="mt-4">다시 시도</Button>
        </div>
      )}

      {/* Product Grid */}
      {!loading && !error && (
        <div className="container mx-auto px-4 py-6">
          {products.length === 0 ? (
            <div className="text-center py-20">
              <div className="mb-4 text-6xl">🔍</div>
              {searchQuery ? (
                <>
                  <h3 className="mb-2">검색 결과가 없습니다</h3>
                  <p className="text-sm text-muted-foreground">
                    "{searchQuery}"에 대한 상품이 없습니다.
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">등록된 상품이 없습니다.</p>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {products.map((product, index) => {
                  // 마지막 상품인 경우 ref 추가
                  if (products.length === index + 1) {
                    return (
                      <div key={product.id} ref={lastProductElementRef}>
                        <ProductCard
                          id={product.id.toString()}
                          image={resolveImageUrl(product.thumbnailImage ?? product.mainImage)}
                          title={product.title}
                          price={product.price}
                          location={product.locationNm}
                          timeAgo={product.timeAgo}
                          likes={product.favoriteCount}
                          chatCount={product.viewCount}
                          isLikedByMe={favoriteProductIds.has(product.id)}
                          onClick={() => onNavigate('detail', product.id.toString())}
                          onNavigate={onNavigate}
                        />
                      </div>
                    );
                  } else {
                    return (
                      <ProductCard
                        key={product.id}
                        id={product.id.toString()}
                        image={resolveImageUrl(product.thumbnailImage ?? product.mainImage)}
                        title={product.title}
                        price={product.price}
                        location={product.locationNm}
                        timeAgo={product.timeAgo}
                        likes={product.favoriteCount}
                        chatCount={product.viewCount}
                        isLikedByMe={favoriteProductIds.has(product.id)}
                        onClick={() => onNavigate('detail', product.id.toString())}
                        onNavigate={onNavigate}
                      />
                    );
                  }
                })}
              </div>

              {/* 추가 로딩 인디케이터 */}
              {loadingMore && (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">상품을 더 불러오는 중...</p>
                </div>
              )}

              {/* 더 이상 로드할 상품이 없을 때 */}
              {!hasMore && products.length > 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">모든 상품을 불러왔습니다.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => onNavigate('register')}
        className="fixed bottom-24 md:bottom-8 right-4 md:right-8 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#5eead4] text-white shadow-lg transition-all hover:bg-[#4dd4c0] hover:shadow-xl"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}
