import { useEffect, useMemo, useState } from "react";
import { Search, ArrowUp, ArrowDown } from "lucide-react";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
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

const TEXT = {
  placeholder: "리셀 상품을 검색해 보세요",
  currentPrice: "현재 시세",
  basePrice: "기준가",
  notEnoughData: "거래 데이터가 충분하지 않습니다.",
  notFound: "조건에 맞는 상품을 찾지 못했습니다.",
};

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
        console.info("resell_auto.json load failed; using default data", err);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [onProductsChange]);

  const pickKoreanName = (product: ResellProductRecord & Record<string, any>) => {
    const rawCandidates = [
      product.nameKo,
      product.name_ko,
      product.koreanName,
      product.localizedName,
      product.name,
    ].filter((v) => typeof v === "string");

    const hasKorean = (text: string) => /[가-힣]/.test(text);

    for (const candidate of rawCandidates) {
      if (!candidate) continue;
      const parts = candidate.split(/\\r?\\n| {2,}|\\t/).filter(Boolean);
      for (const part of parts) {
        if (hasKorean(part)) return part.trim();
      }
      if (hasKorean(candidate)) return candidate.trim();
    }
    return rawCandidates[0] || product.id;
  };

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

      const displayName = pickKoreanName(product as any);

      return {
        ...product,
        image: product.image ?? FALLBACK_IMAGE,
        priceHistory: normalizedHistory,
        displayName,
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
      const displayName = (product as any).displayName || product.name;
      const matchesQuery =
        !query ||
        displayName.toLowerCase().includes(query) ||
        product.brand.toLowerCase().includes(query) ||
        product.id.toLowerCase().includes(query);

      const matchesBrand =
        selectedBrands.length === 0 || selectedBrands.includes(product.brand);

      return matchesQuery && matchesBrand;
    });
  }, [normalizedProducts, searchQuery, selectedBrands]);

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <div className="sticky top-16 z-40 bg-background border-b">
        <div className="container mx-auto max-w-6xl px-4 py-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={TEXT.placeholder}
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
            const displayName = (product as any).displayName || product.name;
            const tagLabel = product.category || product.brand || product.id;

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
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        #{tagLabel}
                      </span>
                      <div
                        className={`flex items-center gap-1 text-sm font-medium ${isPositive ? "text-green-500" : "text-red-500"}`}
                      >
                        {isPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                        {Math.abs(product.changePercent).toFixed(2)}%
                      </div>
                    </div>
                    <p className="text-sm font-medium line-clamp-2">{displayName}</p>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">{TEXT.currentPrice}</p>
                      <p className="text-xl font-semibold">
                        ₩{product.currentPrice.toLocaleString("ko-KR")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {TEXT.basePrice} ₩{product.previousPrice.toLocaleString("ko-KR")}
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
                      {TEXT.notEnoughData}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">{TEXT.notFound}</div>
        )}
      </div>
    </div>
  );
}
