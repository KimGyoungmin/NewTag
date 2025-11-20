import { useEffect, useMemo, useState } from "react";
import { Search, ArrowUp, ArrowDown } from "lucide-react";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import { BrandFilter } from "../components/BrandFilter";
import { RESELL_PRODUCTS, ResellProductRecord } from "../data/resellProducts";

interface ResellPageProps {
  onNavigate: (page: string, id?: string) => void;
  products?: ResellProductRecord[];
  onProductsChange?: (products: ResellProductRecord[]) => void;
}

const FALLBACK_IMAGE = "/api/v1/static/p_default_img.png";
const MAX_HISTORY_LIMIT = 100;

export function ResellPage({ onNavigate, products, onProductsChange }: ResellPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [isAutoFeed, setIsAutoFeed] = useState(false);
  const [localProducts, setLocalProducts] = useState<ResellProductRecord[]>(
    products && products.length ? products : RESELL_PRODUCTS,
  );

  useEffect(() => {
    if (products && products.length) {
      setLocalProducts(products);
    }
  }, [products]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/resell_auto.json", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) return;
        if (!cancelled) {
          setLocalProducts(data);
          onProductsChange?.(data);
          setIsAutoFeed(true);
        }
      } catch (err) {
        console.info("resell_auto.json 불러오기 실패 (정적 데이터로 대체)", err);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [onProductsChange]);

  const normalizedProducts = useMemo(() => {
    const baseProducts = localProducts.length ? localProducts : RESELL_PRODUCTS;
    return baseProducts.map((product) => {
      const normalizedHistory = product.priceHistory
        .map((point) => {
          const numericPrice = point.price ?? point.value ?? 0;
          return {
            ...point,
            price: numericPrice,
            value: numericPrice,
          };
        })
        .filter((point) => point.price > 0);

      return {
        ...product,
        image: product.image ?? FALLBACK_IMAGE,
        priceHistory: normalizedHistory,
      };
    });
  }, [localProducts]);

  const availableBrands = useMemo(() => {
    const deduped = Array.from(
      new Set(normalizedProducts.map((product) => product.brand).filter(Boolean)),
    );
    return deduped.length ? deduped : ["dataset"];
  }, [normalizedProducts]);

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((item) => item !== brand) : [...prev, brand],
    );
  };

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return normalizedProducts.filter((product) => {
      const matchesQuery =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.brand.toLowerCase().includes(query) ||
        product.id.toLowerCase().includes(query);

      const matchesBrand =
        selectedBrands.length === 0 || selectedBrands.includes(product.brand);

      return matchesQuery && matchesBrand;
    });
  }, [normalizedProducts, searchQuery, selectedBrands]);

  const summaryTitle = searchQuery ? `"${searchQuery}" 검색 결과` : "리셀 데이터 연동 상품";
  const summarySubtitle = searchQuery
    ? `${filteredProducts.length}개의 상품이 조건을 만족합니다.`
    : isAutoFeed
      ? "최근 크롤링/예측 결과(resell_auto.json)를 불러왔습니다."
      : "model/Best_test에 있는 실제 거래 데이터를 기반으로 합니다.";

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <div className="sticky top-16 z-40 bg-background border-b">
        <div className="container mx-auto max-w-6xl px-4 py-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="리셀 상품을 검색해 보세요 (예: missing_item_name_0)"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-10"
            />
          </div>

          <BrandFilter
            brands={availableBrands}
            selectedBrands={selectedBrands}
            onToggleBrand={toggleBrand}
          />
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-6 space-y-6">
        <Card className="border-dashed bg-muted/40">
          <CardHeader>
            <CardTitle>AI 시세 전망</CardTitle>
            <p className="text-sm text-muted-foreground">
              크롤링/예측 결과(resell_auto.json)가 생성되면 자동 반영됩니다. 데이터가 없으면 빈 목록이 표시됩니다.
            </p>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            현재는 model/Best_test에 저장된 원본 거래 정보만 연결되어 있습니다. 예측 결과는 super_kream_crawling.py 실행 시 생성됩니다.
          </CardContent>
        </Card>

        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl mb-1">{summaryTitle}</h2>
            <p className="text-sm text-muted-foreground">{summarySubtitle}</p>
          </div>
          <Badge variant="outline" className="text-xs">
            총 {filteredProducts.length}개
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => {
            const priceHistory = product.priceHistory.slice(0, MAX_HISTORY_LIMIT);
            const priceValues = priceHistory.map((point) => point.price);
            const hasHistory = priceValues.length > 0;
            const minPrice = hasHistory ? Math.min(...priceValues) : 0;
            const maxPrice = hasHistory ? Math.max(...priceValues) : 0;
            const paddingBase = hasHistory
              ? Math.max((maxPrice - minPrice) * 0.1, minPrice * 0.05)
              : 1;
            const domainMin = hasHistory ? Math.max(minPrice - paddingBase, 0) : 0;
            const domainMax = hasHistory ? maxPrice + paddingBase : 1;
            const isPositive = product.changePercent >= 0;

            return (
              <Card
                key={product.id}
                className="flex flex-col gap-4 p-4 hover:shadow-lg transition-shadow"
                onClick={() => onNavigate("resell-detail", product.id)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-28 h-28 rounded-lg overflow-hidden bg-muted shrink-0">
                    <ImageWithFallback
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <Badge variant="secondary">#{product.brand}</Badge>
                      <div
                        className={`flex items-center gap-1 text-sm font-medium ${
                          isPositive ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {isPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                        {Math.abs(product.changePercent).toFixed(2)}%
                      </div>
                    </div>
                    <p className="text-sm font-medium line-clamp-2">{product.name}</p>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">현재 시세</p>
                      <p className="text-xl font-semibold">
                        ₩ {product.currentPrice.toLocaleString("ko-KR")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        기준가 ₩ {product.previousPrice.toLocaleString("ko-KR")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="h-24">
                  {hasHistory ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={priceHistory}>
                        <YAxis domain={[domainMin, domainMax]} hide />
                        <Line
                          type="monotone"
                          dataKey="price"
                          stroke={isPositive ? "#10b981" : "#ef4444"}
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      거래 데이터가 충분하지 않습니다.
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            연결된 데이터에서 조건에 맞는 상품을 찾지 못했습니다.
          </div>
        )}
      </div>
    </div>
  );
}
