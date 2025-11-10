import { useState, useEffect } from "react";
import { Plus, MapPin, ArrowUpDown } from "lucide-react";
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

interface HomePageProps {
  onNavigate: (page: string, productId?: string) => void;
}

interface Product {
  id: number;
  mainImage: string;
  title: string;
  price: number;
  locationNm: string;
  createdAt: string;
  viewCount: number;
  favoriteCount: number;
  timeAgo: string;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'latest' | 'price-low' | 'price-high' | 'popular'>('latest');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 상품 목록 불러오기
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const categoryId = selectedCategory === 'all' ? undefined : parseInt(selectedCategory);

      const response = await productsApi.getProducts({
        categoryId,
        sortBy,
        page: 0,
        size: 100,
      });

      setProducts(response.products || []);
    } catch (err: any) {
      console.error('상품 목록 조회 실패:', err);
      setError('상품을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 카테고리 또는 정렬 옵션 변경 시 상품 목록 다시 불러오기
  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, sortBy]);

  return (
    <div className="min-h-screen pb-20 md:pb-8">
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
            <div className="text-center py-20 text-muted-foreground">
              등록된 상품이 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id.toString()}
                  image={product.mainImage}
                  title={product.title}
                  price={product.price}
                  location={product.locationNm}
                  timeAgo={product.timeAgo}
                  likes={product.favoriteCount}
                  chatCount={product.viewCount}
                  onClick={() => onNavigate('detail', product.id.toString())}
                />
              ))}
            </div>
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