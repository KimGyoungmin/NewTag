import { useState, useEffect, useRef, useCallback } from "react";
import { Plus, MapPin, ArrowUpDown, ChevronLeft, Loader2 } from "lucide-react";
import { ProductCard } from "../components/ProductCard";
import { CategoryFilter } from "../components/CategoryFilter";
import { LocationSelectModal } from "../components/LocationSelectModal";
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
import { addressApi, type Address } from "../api/addressApi";
import { resolveImageUrl } from "../utils/image";
import { getAddressFromCoords, getCurrentPosition } from "../utils/kakaoMap";
import { calculateDistance } from "../utils/distance";
import { chatRoomsApi } from "../api/firebase";
import { toast } from "sonner";

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
  latitude?: number;
  longitude?: number;
  createdAt: string;
  viewCount: number;
  favoriteCount: number;
  timeAgo: string;
  seller?: {
    id: number;
    nick: string;
    name: string;
  };
}

export function HomePage({ onNavigate, searchQuery = '', onClearSearch }: HomePageProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'latest' | 'price-low' | 'price-high' | 'popular'>('latest');
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]); // 필터링 전 전체 상품
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favoriteProductIds, setFavoriteProductIds] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [currentLocation, setCurrentLocation] = useState("광주광역시 동구 동명동");
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [myAddresses, setMyAddresses] = useState<Address[]>([]);
  const [addressesLoaded, setAddressesLoaded] = useState(false); // 주소 로드 완료 플래그
  const [chatCounts, setChatCounts] = useState<Map<number, number>>(new Map()); // 상품별 채팅방 개수
  const MAX_DISTANCE_KM = 10; // 최대 거리 10km
  const dedupProducts = (list: Product[]) => {
    const map = new Map<number, Product>();
    list.forEach((p) => {
      if (!map.has(p.id)) map.set(p.id, p);
    });
    return Array.from(map.values());
  };

  // 위치 기반 상품 필터링 함수
  const filterProductsByLocation = (products: Product[], address: Address | null): Product[] => {
    console.log('[HomePage] Filtering products - address:', address, 'total products:', products.length);

    // 주소가 선택되지 않았으면 모든 상품 반환
    if (!address || !address.latitude || !address.longitude) {
      console.log('[HomePage] No address selected, returning all products');
      return products;
    }

    // 선택된 주소로부터 MAX_DISTANCE_KM 이내의 상품만 필터링
    const filtered = products.filter(product => {
      // 상품에 위치 정보가 없으면 제외
      if (!product.latitude || !product.longitude) {
        return false;
      }

      const distance = calculateDistance(
        address.latitude,
        address.longitude,
        product.latitude,
        product.longitude
      );

      return distance <= MAX_DISTANCE_KM;
    });

    console.log('[HomePage] Filtered products:', filtered.length, 'out of', products.length);
    return filtered;
  };

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
      const deduped = dedupProducts(newProducts);
      setAllProducts(deduped);

      // 위치 필터링 적용
      const filtered = filterProductsByLocation(deduped, selectedAddress);
      setProducts(filtered);

      // 상품별 채팅 개수 조회
      if (newProducts.length > 0) {
        const productIds = newProducts.map((p: Product) => p.id);
        const counts = await chatRoomsApi.getChatRoomCountsByProducts(productIds);
        setChatCounts(counts);
      }

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
        const updatedAll = dedupProducts([...allProducts, ...newProducts]);
        setAllProducts(updatedAll);

        // 위치 필터링 적용
        const filtered = filterProductsByLocation(updatedAll, selectedAddress);
        setProducts(filtered);
        setCurrentPage(nextPage);

        // 새로 추가된 상품의 채팅 개수 조회
        const newProductIds = newProducts.map((p: Product) => p.id);
        const newCounts = await chatRoomsApi.getChatRoomCountsByProducts(newProductIds);
        setChatCounts(prev => new Map([...prev, ...newCounts]));
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
  // 단, 초기 로딩 시에는 주소가 로드될 때까지 대기
  useEffect(() => {
    if (addressesLoaded) {
      console.log('[HomePage] Fetching products (addressesLoaded=true)');
      fetchProducts();
    } else {
      console.log('[HomePage] Waiting for addresses to load...');
    }
  }, [selectedCategory, sortBy, searchQuery, addressesLoaded]);

  // 선택된 주소 변경 시 필터링 다시 적용
  useEffect(() => {
    const filtered = filterProductsByLocation(allProducts, selectedAddress);
    setProducts(filtered);
  }, [selectedAddress]);

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

  // 저장된 주소 목록 불러오기
  const loadMyAddresses = async () => {
    const user = authApi.getCurrentUser();
    if (!user) {
      setAddressesLoaded(true);
      return;
    }

    try {
      console.log('[HomePage] Loading addresses...');
      const addresses = await addressApi.getMyAddresses();
      console.log('[HomePage] Addresses loaded:', addresses);
      setMyAddresses(addresses);

      // 기본 주소를 자동 선택 (isDefault가 true인 주소)
      const defaultAddress = addresses.find(addr => addr.isDefault);
      if (defaultAddress) {
        console.log('[HomePage] Auto-selecting default address:', defaultAddress);
        setSelectedAddress(defaultAddress);
        setCurrentLocation(defaultAddress.locationNm);
      } else if (addresses.length > 0 && !selectedAddress) {
        // 기본 주소가 없으면 첫 번째 주소 선택
        console.log('[HomePage] No default address, selecting first:', addresses[0]);
        setSelectedAddress(addresses[0]);
        setCurrentLocation(addresses[0].locationNm);
      }
      setAddressesLoaded(true);
    } catch (error) {
      console.error('주소 목록 로드 실패:', error);
      setAddressesLoaded(true);
    }
  };

  // 선택된 위치 변경 핸들러
  const handleLocationChange = (address: Address | null) => {
    setSelectedAddress(address);
    if (address) {
      setCurrentLocation(address.locationNm);
    }
  };

  const handleUseCurrentLocation = async () => {
    setIsFetchingLocation(true);
    try {
      const position = await getCurrentPosition();
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const address = await getAddressFromCoords(lat, lng);

      // 주소가 빈 문자열이면 직전 값을 유지해 깜빡임을 막는다.
      const nextLocation = address && address.trim()
        ? address
        : currentLocation || "현재 위치";

      setCurrentLocation(nextLocation);
      toast.success("현재 위치로 설정했어요.");
    } catch (error) {
      console.error("현재 위치 가져오기 실패:", error);
      toast.error(error instanceof Error ? error.message : "위치를 불러오지 못했어요.");
    } finally {
      setIsFetchingLocation(false);
    }
  };

  // 로그인 시 주소 목록 로드 (auth-change 이벤트 listen)
  useEffect(() => {
    const handleAuthChange = () => {
      const user = authApi.getCurrentUser();
      const isAuth = authApi.isAuthenticated();

      console.log('[HomePage] Auth changed - user:', user, 'isAuth:', isAuth);

      if (user && isAuth) {
        loadMyAddresses();
      } else {
        // 로그아웃 시 주소 목록 초기화
        setMyAddresses([]);
        setSelectedAddress(null);
        setCurrentLocation("광주광역시 동구 동명동");
      }
    };

    // 초기 로드
    handleAuthChange();

    // auth-change 이벤트 구독
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

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
          <Button
            variant="ghost"
            className="h-auto p-0 hover:bg-transparent max-w-full"
            onClick={() => {
              const user = authApi.getCurrentUser();
              if (!user) {
                toast.error('로그인 후 이용해주세요.');
                onNavigate('login');
                return;
              }
              setShowLocationModal(true);
            }}
          >
            <MapPin className="mr-2 h-4 w-4 text-primary" />
            <span className="max-w-[70vw] md:max-w-[400px] truncate text-foreground text-sm text-left">
              {currentLocation}
            </span>
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
                          chatCount={chatCounts.get(product.id) ?? 0}
                          isLikedByMe={favoriteProductIds.has(product.id)}
                          sellerNick={product.seller?.nick}
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
                        chatCount={chatCounts.get(product.id) ?? 0}
                        isLikedByMe={favoriteProductIds.has(product.id)}
                        sellerNick={product.seller?.nick}
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

      {/* Location Select Modal */}
      <LocationSelectModal
        open={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationChange={handleLocationChange}
        onNavigateToLocationSelect={() => onNavigate('address/add')}
      />
    </div>
  );
}
