import { useMemo, useState } from "react";
import { ChevronLeft, Calendar, TrendingUp, Link as LinkIcon } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { RESELL_PRODUCTS } from "../data/resellProducts";

interface ResellDetailPageProps {
  productId: string;
  onNavigate: (page: string, id?: string) => void;
}

interface ChartPoint {
  label: string;
  actualPrice: number;
}

const FALLBACK_IMAGE = "/api/v1/static/p_default_img.png";
const PERIOD_LIMITS: Record<string, number> = {
  recent: 5,
  short: 20,
  mid: 50,
  long: 100,
};

export function ResellDetailPage({ productId, onNavigate }: ResellDetailPageProps) {
  const product = useMemo(() => RESELL_PRODUCTS.find((item) => item.id === productId), [productId]);
  const [selectedPeriod, setSelectedPeriod] = useState<keyof typeof PERIOD_LIMITS>("short");

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">연결된 데이터에서 상품을 찾을 수 없습니다.</p>
        <Button onClick={() => onNavigate("resell")}>리셀 목록으로 돌아가기</Button>
      </div>
    );
  }

  const priceHistory = product.priceHistory;
  const chartLimit = PERIOD_LIMITS[selectedPeriod];
  const chartData: ChartPoint[] = priceHistory.slice(0, chartLimit).map((entry, index) => ({
    label: entry.date || `거래 ${index + 1}`,
    actualPrice: entry.price,
  }));

  const changePositive = (product.changePercent ?? 0) >= 0;
  const summaryTransactions = priceHistory.slice(0, 6);
  const fullTransactions = priceHistory.slice(0, 50);

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
              <CardTitle>거래 추이</CardTitle>
              <p className="text-sm text-muted-foreground">model/Best_test JSON에서 추출한 실제 거래 금액</p>
            </div>
            <div className="flex gap-2">
              {(
                [
                  { key: "recent", label: "최근 5건" },
                  { key: "short", label: "최근 20건" },
                  { key: "mid", label: "최근 50건" },
                  { key: "long", label: "최대 100건" },
                ] as const
              ).map((option) => (
                <Button
                  key={option.key}
                  variant={selectedPeriod === option.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPeriod(option.key)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="h-72">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="label" hide={chartData.length > 30} tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(value) => `₩${(value / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => `₩ ${value.toLocaleString("ko-KR")}`} />
                  <Line type="monotone" dataKey="actualPrice" stroke="#10b981" strokeWidth={2} dot={false} />
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
                예측 모델 연결 준비 중입니다. 실제 데이터만 먼저 제공됩니다.
              </p>
            </CardHeader>
            <CardContent className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="rounded-full bg-green-500/10 p-3 text-green-500">
                <TrendingUp className="h-6 w-6" />
              </div>
              <p>Gemini 기반 시세 전망이 연결되면 이 영역에서 예상 가격과 변동 폭을 확인할 수 있습니다.</p>
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
