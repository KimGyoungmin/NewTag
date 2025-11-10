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
import { getAllProducts, getTimeAgo, getProductStatus } from "../utils/localStorage";

interface HomePageProps {
  onNavigate: (page: string, productId?: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'latest' | 'price-low' | 'price-high' | 'popular'>('latest');
  const [products, setProducts] = useState(getAllProducts());

  // 상품 목록 새로고침
  useEffect(() => {
    setProducts(getAllProducts());
  }, []);

  // 카테고리 필터링
  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  // 리셀 상품이 아닌 일반 중고 물품만 표시
  const regularProducts = filteredProducts.filter(p => !p.isResell);

  // 정렬 로직
  const sortedProducts = regularProducts.sort((a, b) => {
    if (sortBy === 'latest') {
      return b.createdAt - a.createdAt;
    } else if (sortBy === 'price-low') {
      return a.price - b.price;
    } else if (sortBy === 'price-high') {
      return b.price - a.price;
    } else if (sortBy === 'popular') {
      return (b.likes + b.chatCount) - (a.likes + a.chatCount);
    }
    return 0;
  });

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      {/* Location Bar */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
            <MapPin className="mr-2 h-4 w-4 text-primary" />
            <span>강남구 역삼동</span>
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

      {/* Product Grid */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {sortedProducts.map((product) => (
            <ProductCard
              key={product.id}
              {...product}
              onClick={() => onNavigate('detail', product.id)}
            />
          ))}
        </div>
      </div>

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