import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Calendar } from "lucide-react";
import { RESELL_PRODUCTS, ResellProductRecord } from "../data/resellProducts";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";

interface ResellDetailPageProps {
  productId: string;
  onNavigate: (page: string, id?: string) => void;
  products?: ResellProductRecord[];
}

interface ChartPoint {
  label: string;
  actualPrice: number | null;
  predictedPrice: number | null;
}

const FALLBACK_IMAGE = "/api/v1/static/p_default_img.png";
const PERIOD_CONFIG = {
  week: { label: "7일", days: 7 },
  month: { label: "30일", days: 30 },
  year: { label: "1년", days: 365 },
  all: { label: "전체", days: Number.POSITIVE_INFINITY },
} as const;
type PeriodKey = keyof typeof PERIOD_CONFIG;

function parseHistoryDate(raw?: string): Date | null {
  if (!raw) return null;
  const normalized = raw.trim();
  const slashMatch = normalized.match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
  if (slashMatch) {
    const [, yy, mm, dd] = slashMatch;
    const year = 2000 + Number(yy);
    const candidate = new Date(year, Number(mm) - 1, Number(dd));
    return Number.isNaN(candidate.getTime()) ? null : candidate;
  }
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function filterHistoryByPeriod(history: ResellProductRecord["priceHistory"], period: PeriodKey) {
  const { days } = PERIOD_CONFIG[period];
  if (!history.length || !Number.isFinite(days) || days === Number.POSITIVE_INFINITY) {
    return history;
  }
  const msWindow = days * 24 * 60 * 60 * 1000;
  const enriched = history.map((entry) => ({
    entry,
    parsedDate: parseHistoryDate(entry.date),
  }));
  const referenceDate = [...enriched].reverse().find((item) => item.parsedDate)?.parsedDate;
  if (!referenceDate) {
    return history;
  }
  const threshold = new Date(referenceDate.getTime() - msWindow);
  const filtered = enriched
    .filter((item) => item.parsedDate && item.parsedDate >= threshold)
    .map((item) => item.entry);
  return filtered.length ? filtered : history;
}

function sortHistoryChronologically(history: ResellProductRecord["priceHistory"]) {
  const enriched = history.map((entry, index) => ({
    entry,
    parsedDate: parseHistoryDate(entry.date),
    index,
  }));
  const sorted = enriched.sort((a, b) => {
    if (a.parsedDate && b.parsedDate) return a.parsedDate.getTime() - b.parsedDate.getTime();
    if (a.parsedDate && !b.parsedDate) return -1;
    if (!a.parsedDate && b.parsedDate) return 1;
    return a.index - b.index;
  });
  return sorted.map((item) => item.entry);
}

export function ResellDetailPage({ productId, onNavigate, products }: ResellDetailPageProps) {
  const [remoteProducts, setRemoteProducts] = useState<ResellProductRecord[]>([]);
  useEffect(() => {
    if (products && products.length) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/resell_auto.json?t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data) && data.length) {
          setRemoteProducts(data);
        }
      } catch (err) {
        console.info("resell_auto.json load failed in detail page", err);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [products]);

  const productList =
    (products && products.length ? products : undefined) ??
    (remoteProducts.length ? remoteProducts : RESELL_PRODUCTS);
  const product = useMemo(() => productList.find((item) => item.id === productId), [productId, productList]);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>("month");
  const [chartAspect, setChartAspect] = useState(2.2);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth || 1;
      // 좁은 화면에서는 좀 더 세로 길게, 넓은 화면은 가로 길게
      setChartAspect(width < 768 ? 1.6 : 2.4);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">해당 상품을 찾을 수 없습니다.</p>
        <Button onClick={() => onNavigate("resell")}>목록으로 돌아가기</Button>
      </div>
    );
  }

  const pickKoreanName = (p: ResellProductRecord & Record<string, any>) => {
    const rawCandidates = [p.nameKo, p.name_ko, p.koreanName, p.localizedName, p.name].filter(
      (v) => typeof v === "string",
    );
    const hasKorean = (text: string) => /[가-힣]/.test(text);
    for (const candidate of rawCandidates) {
      if (!candidate) continue;
      const parts = candidate.split(/\r?\n| {2,}|\t/).filter(Boolean);
      for (const part of parts) {
        if (hasKorean(part)) return part.trim();
      }
      if (hasKorean(candidate)) return candidate.trim();
    }
    return rawCandidates[0] || p.id;
  };

  const displayName = pickKoreanName(product as any);
  const englishName = product.name;

  const priceHistory = useMemo(() => sortHistoryChronologically(product.priceHistory), [product.priceHistory]);
  const predictions = product.predictions ?? [];
  const filteredHistory = useMemo(
    () => filterHistoryByPeriod(priceHistory, selectedPeriod),
    [priceHistory, selectedPeriod],
  );

  const chartData: ChartPoint[] = useMemo(() => {
    const actualSlice = filteredHistory.map((entry, index) => ({
      label: entry.date || `거래 ${index + 1}`,
      actualPrice: entry.price,
      predictedPrice: null,
    }));

    const predictionSlice = predictions.map((entry) => ({
      label: `예측 +${entry.horizon}일`,
      actualPrice: null,
      predictedPrice: entry.predictedPrice ?? null,
    }));

    return [...actualSlice, ...predictionSlice];
  }, [filteredHistory, predictions]);

  const yDomain = useMemo(() => {
    const values: number[] = [];
    chartData.forEach((pt) => {
      if (typeof pt.actualPrice === "number") values.push(pt.actualPrice);
      if (typeof pt.predictedPrice === "number") values.push(pt.predictedPrice);
    });
    if (!values.length) return [0, "auto"] as const;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = Math.max((max - min) * 0.1, min * 0.05);
    const lower = Math.max(min - padding, 0);
    const upper = max + padding;
    return [lower, upper] as const;
  }, [chartData]);

  const changePositive = (product.changePercent ?? 0) >= 0;
  const fullTransactions = [...priceHistory].slice(-50).reverse();
  const hasPredictions = predictions.length > 0;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="container mx-auto max-w-5xl px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => onNavigate("resell")} aria-label="뒤로 가기">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="truncate text-lg font-semibold">{displayName}</h1>
            {englishName && englishName !== displayName && (
              <p className="truncate text-sm text-muted-foreground">{englishName}</p>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 py-6 space-y-6">
        <Card>
          <CardContent className="flex flex-col gap-6 p-6 md:flex-row">
            <div className="w-full md:w-48 h-48 rounded-xl overflow-hidden bg-muted">
              <ImageWithFallback
                src={product.image ?? FALLBACK_IMAGE}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">#{product.category || product.id}</Badge>
                <span className="text-xs text-muted-foreground">{product.category}</span>
              </div>
              {englishName && englishName !== displayName && (
                <p className="text-sm text-muted-foreground">{englishName}</p>
              )}
              <div>
                <p className="text-sm text-muted-foreground">현재 시세</p>
                <p className="text-3xl font-semibold">₩ {product.currentPrice.toLocaleString("ko-KR")}</p>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground">기준가</span>
                <span>₩ {product.previousPrice.toLocaleString("ko-KR")}</span>
                <span className={changePositive ? "text-green-500" : "text-red-500"}>
                  {changePositive ? "+" : "-"}
                  {Math.abs(product.changePercent ?? 0).toFixed(2)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>거래 추이 + 예측</CardTitle>
            </div>
            <div className="flex gap-2">
              {(Object.entries(PERIOD_CONFIG) as Array<[PeriodKey, { label: string }]>).map(([key, config]) => (
                <Button
                  key={key}
                  variant={selectedPeriod === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPeriod(key)}
                >
                  {config.label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="min-h-[280px] w-full overflow-x-auto">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" aspect={chartAspect}>
                <LineChart data={chartData}>
                  <XAxis
                    dataKey="label"
                    angle={-25}
                    tick={{ fontSize: 10, textAnchor: "end" }}
                    interval="preserveStartEnd"
                  />
                  <YAxis tickFormatter={(value) => `₩${(value / 1000).toFixed(0)}k`} domain={yDomain} />
                  <Tooltip
                    formatter={(value: number | string | null, name) => {
                      if (value == null) return ["값 없음", ""];
                      const numeric = typeof value === "number" ? value : Number(value);
                      const label = name === "predictedPrice" ? "예측" : "실거래";
                      return [`₩ ${numeric.toLocaleString("ko-KR")}`, label];
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="actualPrice"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    activeDot={{ r: 4 }}
                    name="실거래"
                  />
                  {hasPredictions && (
                    <Line
                      type="monotone"
                      dataKey="predictedPrice"
                      stroke="#f97316"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 5 }}
                      strokeDasharray="6 4"
                      name="예측"
                    />
                  )}
                  <Legend
                    verticalAlign="top"
                    height={28}
                    formatter={(value) => (value === "predictedPrice" ? "예측" : "실거래")}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                거래 그래프를 표시할 데이터가 부족합니다.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>거래 내역</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[520px] overflow-y-auto">
            {fullTransactions.map((entry, index) => (
              <div
                key={`${product.id}-history-${index}`}
                className="flex items-center justify-between border-b py-2 text-sm last:border-0"
              >
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{entry.date || `거래 ${index + 1}`}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₩ {entry.price.toLocaleString("ko-KR")}</p>
                  {entry.size && <p className="text-xs text-muted-foreground">{entry.size}</p>}
                </div>
              </div>
            ))}
            {fullTransactions.length === 0 && (
              <p className="text-sm text-muted-foreground">거래 내역이 없습니다.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

}

