import { useState, useEffect } from "react";
import { Search, X, TrendingUp, Clock, SlidersHorizontal, ChevronLeft } from "lucide-react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ProductCard } from "../components/ProductCard";
import { CategoryFilter } from "../components/CategoryFilter";
import { BrandFilter } from "../components/BrandFilter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

interface SearchPageProps {
  onNavigate: (page: string, id?: string) => void;
  initialQuery?: string;
  isResellMode?: boolean;
}

export function SearchPage({ onNavigate, initialQuery = '', isResellMode = false }: SearchPageProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(!!initialQuery);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('latest');
  const [recentSearches, setRecentSearches] = useState<string[]>([
    '아이패드',
    '맥북',
    '책상',
    '의자'
  ]);

  // Mock popular searches
  const popularSearches = [
    { keyword: '아이폰 15', count: 1234 },
    { keyword: '에어팟', count: 892 },
    { keyword: '맥북', count: 756 },
    { keyword: '갤럭시', count: 643 },
    { keyword: '닌텐도 스위치', count: 521 },
    { keyword: '소파', count: 487 },
    { keyword: '책상', count: 421 },
    { keyword: '자전거', count: 398 },
  ];

  // Brand list for resell mode
  const brands = [
    'Nike', 'Adidas', 'Apple', 'Samsung', 'Chanel', 'Louis Vuitton', 
    'Rolex', 'Gucci', 'Prada', 'Supreme', 'Jordan', 'Balenciaga'
  ];

  const toggleBrand = (brand: string) => {
    if (selectedBrands.includes(brand)) {
      setSelectedBrands(selectedBrands.filter(b => b !== brand));
    } else {
      setSelectedBrands([...selectedBrands, brand]);
    }
  };

  // Mock search results
  const allProducts = [
    {
      id: '1',
      image: 'https://images.unsplash.com/photo-1758186355698-bd0183fc75ed?w=400',
      title: '아이패드 프로 11인치 M2칩 (2022)',
      price: 850000,
      location: '강남구 역삼동',
      timeAgo: '1시간 전',
      likes: 12,
      chatCount: 5,
      status: 'available' as const,
      category: 'electronics',
      isResell: false
    },
    {
      id: '2',
      image: 'https://images.unsplash.com/photo-1634824506573-4a430d1d6111?w=400',
      title: '북유럽 스타일 원목 책상 세트',
      price: 120000,
      location: '서초구 서초동',
      timeAgo: '2시간 전',
      likes: 8,
      chatCount: 3,
      status: 'available' as const,
      category: 'furniture',
      isResell: false
    },
    {
      id: '3',
      image: 'https://images.unsplash.com/photo-1687253946687-a3713aa25b2f?w=400',
      title: '겨울 패딩 점퍼 (미착용)',
      price: 65000,
      location: '송파구 잠실동',
      timeAgo: '3시간 전',
      likes: 23,
      chatCount: 11,
      status: 'available' as const,
      category: 'fashion',
      isResell: false
    },
    {
      id: '4',
      image: 'https://images.unsplash.com/photo-1580234797602-22c37b2a6230?w=400',
      title: 'PS5 디지털 에디션',
      price: 380000,
      location: '마포구 상암동',
      timeAgo: '4시간 전',
      likes: 18,
      chatCount: 9,
      status: 'available' as const,
      category: 'electronics',
      isResell: false
    },
    {
      id: '5',
      image: 'https://images.unsplash.com/photo-1579535984712-92fffbbaa266?w=400',
      title: '캐논 EOS R6 미러리스 카메라',
      price: 1850000,
      location: '강남구 삼성동',
      timeAgo: '5시간 전',
      likes: 45,
      chatCount: 28,
      status: 'available' as const,
      category: 'electronics',
      isResell: false
    },
    {
      id: '6',
      image: 'https://images.unsplash.com/photo-1731772252134-fa894dac7768?w=400',
      title: '자전거 로드바이크 (거의 새것)',
      price: 450000,
      location: '용산구 이촌동',
      timeAgo: '6시간 전',
      likes: 32,
      chatCount: 19,
      status: 'available' as const,
      category: 'sports',
      isResell: false
    },
    {
      id: '7',
      image: 'https://images.unsplash.com/photo-1758186355698-bd0183fc75ed?w=400',
      title: '맥북 에어 M2 13인치',
      price: 1200000,
      location: '강남구 역삼동',
      timeAgo: '1일 전',
      likes: 28,
      chatCount: 15,
      status: 'available' as const,
      category: 'electronics',
      isResell: false
    },
    {
      id: '8',
      image: 'https://images.unsplash.com/photo-1634824506573-4a430d1d6111?w=400',
      title: '이케아 의자 마르쿠스',
      price: 80000,
      location: '서초구 서초동',
      timeAgo: '1일 전',
      likes: 15,
      chatCount: 8,
      status: 'available' as const,
      category: 'furniture',
      isResell: false
    },
    // Resell products
    {
      id: '9',
      image: 'https://images.unsplash.com/photo-1618677831741-6260a73ff4f9?w=400',
      title: '에어조던 1 레트로 하이 시카고',
      price: 450000,
      location: '강남구 역삼동',
      timeAgo: '2시간 전',
      likes: 56,
      chatCount: 32,
      status: 'available' as const,
      category: 'fashion',
      isResell: true,
      brand: 'Nike'
    },
    {
      id: '10',
      image: 'https://images.unsplash.com/photo-1591348278863-a8fb3887e2aa?w=400',
      title: '샤넬 클래식 플랩백',
      price: 8900000,
      location: '서초구 반포동',
      timeAgo: '3시간 전',
      likes: 89,
      chatCount: 45,
      status: 'available' as const,
      category: 'fashion',
      isResell: true,
      brand: 'Chanel'
    },
    {
      id: '11',
      image: 'https://images.unsplash.com/photo-1670177257750-9b47927f68eb?w=400',
      title: '롤렉스 서브마리너',
      price: 15500000,
      location: '강남구 청담동',
      timeAgo: '1시간 전',
      likes: 123,
      chatCount: 67,
      status: 'available' as const,
      category: 'fashion',
      isResell: true,
      brand: 'Rolex'
    },
    {
      id: '12',
      image: 'https://images.unsplash.com/photo-1626071720029-b9512b1c1eb4?w=400',
      title: '맥북 프로 M3 Max',
      price: 3200000,
      location: '마포구 서교동',
      timeAgo: '4시간 전',
      likes: 67,
      chatCount: 38,
      status: 'available' as const,
      category: 'electronics',
      isResell: true,
      brand: 'Apple'
    },
    {
      id: '13',
      image: 'https://images.unsplash.com/photo-1618677831741-6260a73ff4f9?w=400',
      title: '나이키 덩크 로우 판다',
      price: 180000,
      location: '송파구 잠실동',
      timeAgo: '5시간 전',
      likes: 45,
      chatCount: 23,
      status: 'available' as const,
      category: 'fashion',
      isResell: true,
      brand: 'Nike'
    },
    {
      id: '14',
      image: 'https://images.unsplash.com/photo-1591348278863-a8fb3887e2aa?w=400',
      title: '루이비통 네버풀 MM',
      price: 2100000,
      location: '강남구 신사동',
      timeAgo: '6시간 전',
      likes: 78,
      chatCount: 41,
      status: 'available' as const,
      category: 'fashion',
      isResell: true,
      brand: 'Louis Vuitton'
    },
  ];

  const handleSearch = (query: string) => {
    if (query.trim()) {
      setSearchQuery(query);
      setIsSearching(true);
      
      // Add to recent searches if not already there
      if (!recentSearches.includes(query)) {
        setRecentSearches([query, ...recentSearches.slice(0, 9)]);
      }
    }
  };

  // Handle initial query on mount
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      // Add to recent searches if not already there
      if (!recentSearches.includes(initialQuery)) {
        setRecentSearches([initialQuery, ...recentSearches.slice(0, 9)]);
      }
    }
  }, [initialQuery]);

  const handleRecentSearchClick = (query: string) => {
    setSearchQuery(query);
    setIsSearching(true);
  };

  const handleRemoveRecentSearch = (query: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches(recentSearches.filter(q => q !== query));
  };

  const clearAllRecentSearches = () => {
    setRecentSearches([]);
  };

  const handleBack = () => {
    if (isSearching) {
      setIsSearching(false);
      setSearchQuery('');
    } else {
      onNavigate(isResellMode ? 'resell' : 'home');
    }
  };

  // Filter and sort products
  let filteredProducts = allProducts;
  
  // Filter by resell mode
  if (isResellMode) {
    filteredProducts = filteredProducts.filter(p => p.isResell === true);
  } else {
    filteredProducts = filteredProducts.filter(p => p.isResell === false);
  }
  
  if (searchQuery) {
    filteredProducts = filteredProducts.filter(p => 
      p.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  
  if (selectedCategory !== 'all') {
    filteredProducts = filteredProducts.filter(p => p.category === selectedCategory);
  }

  // Filter by brands (resell mode only)
  if (isResellMode && selectedBrands.length > 0) {
    filteredProducts = filteredProducts.filter(p => 
      'brand' in p && selectedBrands.includes(p.brand as string)
    );
  }

  switch (sortBy) {
    case 'price-low':
      filteredProducts = [...filteredProducts].sort((a, b) => a.price - b.price);
      break;
    case 'price-high':
      filteredProducts = [...filteredProducts].sort((a, b) => b.price - a.price);
      break;
    case 'popular':
      filteredProducts = [...filteredProducts].sort((a, b) => b.likes - a.likes);
      break;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Search Header */}
      <div className="sticky top-0 z-50 border-b bg-background">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleBack}
              className="shrink-0"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder={isResellMode ? "리셀 상품을 검색하세요" : "상품명, 카테고리 등을 검색하세요"}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                className="pl-10 pr-10"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearching(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button 
              onClick={() => handleSearch(searchQuery)}
              size="sm"
              className="bg-primary hover:bg-primary-hover shrink-0"
            >
              검색
            </Button>
          </div>
        </div>
      </div>

      {!isSearching ? (
        /* Search Landing Page */
        <div className="container mx-auto max-w-4xl px-4 py-6 space-y-8">
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <h3>최근 검색어</h3>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={clearAllRecentSearches}
                >
                  전체 삭제
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((query, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer py-2 px-3 hover:bg-secondary/80 transition-colors"
                    onClick={() => handleRecentSearchClick(query)}
                  >
                    {query}
                    <button
                      onClick={(e) => handleRemoveRecentSearch(query, e)}
                      className="ml-2 hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Popular Searches */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3>인기 검색어</h3>
            </div>
            <div className="space-y-2">
              {popularSearches.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentSearchClick(item.keyword)}
                  className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left"
                >
                  <span className={`flex h-6 w-6 items-center justify-center rounded text-sm ${
                    index < 3 ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'
                  }`}>
                    {index + 1}
                  </span>
                  <span className="flex-1">{item.keyword}</span>
                  <span className="text-sm text-muted-foreground">
                    {item.count.toLocaleString()}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Recommended Categories */}
          <div>
            <h3 className="mb-4">추천 카테고리</h3>
            <div className="grid grid-cols-4 gap-3">
              {[
                { id: 'electronics', label: '전자기기', emoji: '📱' },
                { id: 'furniture', label: '가구', emoji: '🪑' },
                { id: 'fashion', label: '의류', emoji: '👕' },
                { id: 'sports', label: '스포츠', emoji: '⚽' },
                { id: 'books', label: '도서', emoji: '📚' },
                { id: 'beauty', label: '뷰티', emoji: '💄' },
                { id: 'toys', label: '장난감', emoji: '🧸' },
                { id: 'etc', label: '기타', emoji: '🎁' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setIsSearching(true);
                  }}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 hover:border-primary hover:bg-primary/5 transition-all"
                >
                  <span className="text-2xl">{cat.emoji}</span>
                  <span className="text-sm">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Search Results */
        <div>
          {/* Filters Bar */}
          {isResellMode ? (
            /* Brand Filter for Resell Mode */
            <div className="border-b bg-background sticky top-[73px] z-40">
              <div className="container mx-auto px-4 py-3">
                <BrandFilter 
                  brands={brands}
                  selectedBrands={selectedBrands}
                  onToggleBrand={toggleBrand}
                />
              </div>
            </div>
          ) : (
            /* Category Filter for Normal Mode */
            <div className="border-b bg-background sticky top-[73px] z-40">
              <div className="container mx-auto px-4 py-3">
                <CategoryFilter 
                  selected={selectedCategory} 
                  onSelect={setSelectedCategory}
                />
              </div>
            </div>
          )}

          {/* Sort and Count */}
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                검색결과
              </span>
              <span className="text-primary">
                {filteredProducts.length}개
              </span>
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px] h-9">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">최신순</SelectItem>
                <SelectItem value="price-low">낮은 가격순</SelectItem>
                <SelectItem value="price-high">높은 가격순</SelectItem>
                <SelectItem value="popular">인기순</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results Grid */}
          <div className="container mx-auto px-4 pb-6">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    {...product}
                    onClick={() => onNavigate('detail', product.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="mb-4 text-6xl">🔍</div>
                <h3 className="mb-2">검색 결과가 없습니다</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  다른 검색어로 다시 시도해보세요
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearching(false);
                  }}
                >
                  새로 검색하기
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
