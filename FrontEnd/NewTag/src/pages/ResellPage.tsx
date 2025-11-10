import { useState } from "react";
import { TrendingUp, Search, ArrowUp, ArrowDown, Calendar, BarChart3 } from "lucide-react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import { BrandFilter } from "../components/BrandFilter";

interface ResellPageProps {
  onNavigate: (page: string, id?: string) => void;
}

interface ResellProduct {
  id: string;
  name: string;
  brand: string;
  image: string;
  currentPrice: number;
  lastMonthPrice: number;
  changePercent: number;
  category: string;
  priceHistory: { value: number }[];
}

export function ResellPage({ onNavigate }: ResellPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceSearchResult, setPriceSearchResult] = useState<any>(null);

  const brands = [
    "Nike", "Adidas", "Apple", "Samsung", "Chanel", 
    "Louis Vuitton", "Rolex", "Gucci", "Prada", 
    "Supreme", "Jordan", "Balenciaga"
  ];

  const toggleBrand = (brand: string) => {
    if (selectedBrands.includes(brand)) {
      setSelectedBrands(selectedBrands.filter(b => b !== brand));
    } else {
      setSelectedBrands([...selectedBrands, brand]);
    }
  };

  const resellProducts: ResellProduct[] = [
    {
      id: "1",
      name: "에어조던 1 레트로 하이 시카고",
      brand: "Nike",
      image: "https://images.unsplash.com/photo-1618677831741-6260a73ff4f9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbmVha2VyJTIwY29sbGVjdGlvbnxlbnwxfHx8fDE3NjIzMTAxODF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      currentPrice: 450000,
      lastMonthPrice: 420000,
      changePercent: 7.1,
      category: "sneakers",
      priceHistory: [
        { value: 400000 },
        { value: 410000 },
        { value: 420000 },
        { value: 435000 },
        { value: 445000 },
        { value: 450000 },
      ],
    },
    {
      id: "2",
      name: "샤넬 클래식 플랩백",
      brand: "Chanel",
      image: "https://images.unsplash.com/photo-1591348278863-a8fb3887e2aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBoYW5kYmFnfGVufDF8fHx8MTc2MjI0NjAyN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      currentPrice: 8900000,
      lastMonthPrice: 9200000,
      changePercent: -3.3,
      category: "luxury",
      priceHistory: [
        { value: 9400000 },
        { value: 9300000 },
        { value: 9200000 },
        { value: 9100000 },
        { value: 9000000 },
        { value: 8900000 },
      ],
    },
    {
      id: "3",
      name: "롤렉스 서브마리너",
      brand: "Rolex",
      image: "https://images.unsplash.com/photo-1670177257750-9b47927f68eb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjB3YXRjaHxlbnwxfHx8fDE3NjIyMDE2MjJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      currentPrice: 15500000,
      lastMonthPrice: 15200000,
      changePercent: 2.0,
      category: "watch",
      priceHistory: [
        { value: 15000000 },
        { value: 15100000 },
        { value: 15200000 },
        { value: 15300000 },
        { value: 15400000 },
        { value: 15500000 },
      ],
    },
    {
      id: "4",
      name: "맥북 프로 M3 Max",
      brand: "Apple",
      image: "https://images.unsplash.com/photo-1626071720029-b9512b1c1eb4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpcGhvbmUlMjBtYWNib29rfGVufDF8fHx8MTc2MjMxMDE4MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      currentPrice: 3200000,
      lastMonthPrice: 3400000,
      changePercent: -5.9,
      category: "electronics",
      priceHistory: [
        { value: 3500000 },
        { value: 3450000 },
        { value: 3400000 },
        { value: 3300000 },
        { value: 3250000 },
        { value: 3200000 },
      ],
    },
    {
      id: "5",
      name: "나이키 덩크 로우 판다",
      brand: "Nike",
      image: "https://images.unsplash.com/photo-1618677831741-6260a73ff4f9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbmVha2VyJTIwY29sbGVjdGlvbnxlbnwxfHx8fDE3NjIzMTAxODF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      currentPrice: 180000,
      lastMonthPrice: 175000,
      changePercent: 2.9,
      category: "sneakers",
      priceHistory: [
        { value: 170000 },
        { value: 172000 },
        { value: 175000 },
        { value: 176000 },
        { value: 178000 },
        { value: 180000 },
      ],
    },
    {
      id: "6",
      name: "루이비통 네버풀 MM",
      brand: "Louis Vuitton",
      image: "https://images.unsplash.com/photo-1591348278863-a8fb3887e2aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBoYW5kYmFnfGVufDF8fHx8MTc2MjI0NjAyN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      currentPrice: 2100000,
      lastMonthPrice: 2050000,
      changePercent: 2.4,
      category: "luxury",
      priceHistory: [
        { value: 2000000 },
        { value: 2020000 },
        { value: 2050000 },
        { value: 2070000 },
        { value: 2085000 },
        { value: 2100000 },
      ],
    },
  ];

  // Filter products by search query and selected brands
  let filteredProducts = resellProducts;

  // Filter by search query
  if (searchQuery.trim()) {
    filteredProducts = filteredProducts.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Filter by selected brands
  if (selectedBrands.length > 0) {
    filteredProducts = filteredProducts.filter((p) => selectedBrands.includes(p.brand));
  }

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      {/* Search Bar */}
      <div className="sticky top-16 z-40 bg-background border-b">
        <div className="container mx-auto max-w-6xl px-4 py-3">
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="리셀 상품을 검색하세요 (예: 에어조던, 샤넬)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Brand Filter */}
          <BrandFilter 
            brands={brands}
            selectedBrands={selectedBrands}
            onToggleBrand={toggleBrand}
          />
        </div>
      </div>

      {/* Resell Items */}
      <div className="container mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl mb-2">
                {searchQuery ? `"${searchQuery}" 검색 결과` : '인기 리셀 상품'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {searchQuery 
                  ? `${filteredProducts.length}개의 상품을 찾았습니다` 
                  : '실시간 시세 변동 확인'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => {
            // 그래프 범위를 계산하여 변화를 강조
            const prices = product.priceHistory.map(p => p.value);
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            const range = maxPrice - minPrice;
            const padding = range * 0.1; // 10% 패딩
            
            return (
              <Card
                key={product.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => onNavigate("resell-detail", product.id)}
              >
                <div className="flex">
                  {/* Left: Product Image */}
                  <div className="w-1/3 h-48 bg-background shrink-0">
                    <ImageWithFallback
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Right: Graph and Product Info */}
                  <div className="flex-1 flex flex-col p-4">
                    {/* Header with brand and change */}
                    <div className="flex items-start justify-between mb-2">
                      <Badge className="bg-secondary text-foreground border text-xs">
                        {product.brand}
                      </Badge>
                      <div
                        className={`flex items-center gap-1 ${
                          product.changePercent > 0 ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {product.changePercent > 0 ? (
                          <ArrowUp className="h-4 w-4" />
                        ) : (
                          <ArrowDown className="h-4 w-4" />
                        )}
                        <span className="text-sm">
                          {Math.abs(product.changePercent)}%
                        </span>
                      </div>
                    </div>

                    {/* Product Name */}
                    <h3 className="mb-3 line-clamp-2 text-sm">{product.name}</h3>

                    {/* Mini Graph */}
                    <div className="flex-1 mb-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={product.priceHistory}>
                          <YAxis
                            domain={[minPrice - padding, maxPrice + padding]}
                            hide={true}
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke={product.changePercent > 0 ? "#10b981" : "#ef4444"}
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Price Info */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">현재 시세</p>
                      <p className="text-xl text-primary">
                        ₩{product.currentPrice.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">해당 카테고리에 상품이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
