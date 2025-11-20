import { useMemo, useState } from "react";
import { ChevronLeft, Calendar, TrendingUp, Link as LinkIcon } from "lucide-react";
import { RESELL_PRODUCTS, ResellProductRecord } from "../data/resellProducts";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

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
  if (!raw) {
    return null;
  }
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
    if (a.parsedDate && b.parsedDate) {
      return a.parsedDate.getTime() - b.parsedDate.getTime();
    }
    if (a.parsedDate && !b.parsedDate) {
      return -1;
    }
    if (!a.parsedDate && b.parsedDate) {
      return 1;
    }
    return a.index - b.index;
  });
  return sorted.map((item) => item.entry);
}

export function ResellDetailPage({ productId, onNavigate, products }: ResellDetailPageProps) {
  const productList = products && products.length ? products : RESELL_PRODUCTS;
  const product = useMemo(() => productList?.find((item) => item.id === productId), [productId, productList]);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>("month");

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">연결된 데이터에서 상품을 찾을 수 없습니다.</p>
        <Button onClick={() => onNavigate("resell")}>리셀 목록으로 돌아가기</Button>
      </div>
    );
  }

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
      actualPrice: entry.truePrice ?? null,
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
  const summaryTransactions = [...priceHistory].slice(-6).reverse();
  const fullTransactions = [...priceHistory].slice(-50).reverse();
  const hasPredictions = predictions.length > 0;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="container mx-auto max-w-5xl px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => onNavigate("resell")} aria-label="리셀 목록으로">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="truncate text-lg font-semibold">{product.name}</h1>
            <p className="text-sm text-muted-foreground">#{product.brand}</p>
          </div>
          <Badge variant="outline">ID: {product.id}</Badge>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 py-6 space-y-6">
        <Card>
          <CardContent className="flex flex-col gap-6 p-6 md:flex-row">
            <div className="w-full md:w-48 h-48 rounded-xl overflow-hidden bg-muted">
              <ImageWithFallback
                src={product.image ?? FALLBACK_IMAGE}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{product.category}</Badge>
                {product.productUrl && (
                  <a
                    href={product.productUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary underline flex items-center gap-1"
                  >
                    <LinkIcon className="h-3 w-3" /> KREAM 상세 페이지
                  </a>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">현재 시세</p>
                <p className="text-3xl font-semibold">₩ {product.currentPrice.toLocaleString("ko-KR")}</p>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground">직전 기준가</span>
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
              <CardTitle>거래 추이 + 예측 결과</CardTitle>
              <p className="text-sm text-muted-foreground">
                model/Best_test JSON의 실거래와 predictions_h6.csv의 예측값을 한 그래프에서 확인합니다.
              </p>
            </div>
            <div className="flex gap-2">
              {(
                Object.entries(PERIOD_CONFIG) as Array<[PeriodKey, { label: string }]>
              ).map(([key, config]) => (
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
          <CardContent className="h-72">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, angle: -25, textAnchor: "end" }}
                    interval="preserveStartEnd"
                  />
                  <YAxis tickFormatter={(value) => `₩${(value / 1000).toFixed(0)}k`} domain={yDomain} />
                  <Tooltip
                    formatter={(value: number | null) =>
                      value === null ? "데이터 없음" : `₩ ${value.toLocaleString("ko-KR")}`
                    }
                  />
                  <Line type="monotone" dataKey="actualPrice" stroke="#10b981" strokeWidth={2} dot={false} name="실거래" />
                  {hasPredictions && (
                    <Line
                      type="monotone"
                      dataKey="predictedPrice"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={false}
                      strokeDasharray="6 4"
                      name="예측"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                표시할 거래 데이터가 부족합니다.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>AI 시세 전망</CardTitle>
              <p className="text-sm text-muted-foreground">
                TSMixer 예측 결과를 그대로 노출합니다. 추후 Gemini 설명도 추가할 예정입니다.
              </p>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              {hasPredictions ? (
                predictions.map((entry) => (
                  <div key={`${product.id}-prediction-${entry.horizon}`} className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-foreground">+{entry.horizon}일</span>
                      <p className="text-xs">예상가</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">
                        ₩ {entry.predictedPrice?.toLocaleString("ko-KR") ?? "-"}
                      </p>
                      {entry.truePrice && (
                        <p className="text-xs text-muted-foreground">
                          비교값: ₩ {entry.truePrice.toLocaleString("ko-KR")}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-green-500/10 p-3 text-green-500">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <p>예측 데이터가 아직 없습니다. 모델 학습 후 다시 시도해 주세요.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>요약 거래</CardTitle>
              <p className="text-sm text-muted-foreground">데이터셋 기준 상위 6건</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {summaryTransactions.map((entry, index) => (
                <div key={`${product.id}-summary-${index}`} className="flex items-center justify-between text-sm">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">{entry.date || `거래 ${index + 1}`}</span>
                    {entry.size && <span className="text-xs text-muted-foreground">규격: {entry.size}</span>}
                  </div>
                  <span className="font-semibold">₩ {entry.price.toLocaleString("ko-KR")}</span>
                </div>
              ))}
              {summaryTransactions.length === 0 && (
                <p className="text-sm text-muted-foreground">거래 정보가 없습니다.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>상세 거래 내역</CardTitle>
            <p className="text-sm text-muted-foreground">JSON에서 추출한 원본 거래를 최대 50건까지 노출합니다.</p>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[420px] overflow-y-auto">
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
              <p className="text-sm text-muted-foreground">거래 데이터가 없습니다.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}







