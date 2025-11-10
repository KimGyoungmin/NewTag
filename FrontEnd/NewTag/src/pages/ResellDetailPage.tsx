import { useState, useMemo } from "react";
import { ChevronLeft, TrendingUp, ArrowUp, ArrowDown, Calendar, Eye, Heart, Share2, Bot, Star } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ResellDetailPageProps {
  productId: string;
  onNavigate: (page: string, id?: string) => void;
}

interface PriceData {
  date: string;
  actualPrice: number | null;
  predictedPrice: number;
  unopenedCondition?: number;
  openedCondition?: number;
}

interface SaleItem {
  id: string;
  price: number;
  condition: string;
  size?: string;
  location: string;
  seller: string;
  sellerRating: number;
  image: string;
  postedAt: string;
}

// 일별 데이터 생성 함수
function generateDailyData(): PriceData[] {
  const data: PriceData[] = [];
  const startDate = new Date(2025, 9, 5); // 2025-10-05
  const today = new Date(2025, 10, 5); // 2025-11-05
  
  let basePrice = 420000;
  
  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
    
    // 가격 변동 시뮬레이션
    const randomChange = (Math.random() - 0.5) * 10000;
    basePrice += randomChange;
    basePrice = Math.max(400000, Math.min(480000, basePrice));
    
    const isFuture = d > today;
    
    data.push({
      date: dateStr,
      actualPrice: isFuture ? null : Math.round(basePrice),
      predictedPrice: Math.round(basePrice + (isFuture ? 15000 : 5000)),
      unopenedCondition: Math.round(basePrice * 1.08),
      openedCondition: Math.round(basePrice * 0.92),
    });
  }
  
  return data;
}

// 주별 데이터 생성 함수
function generateWeeklyData(): PriceData[] {
  const data: PriceData[] = [];
  const startDate = new Date(2025, 7, 11); // 2025-08-11 (약 3개월 전)
  const today = new Date(2025, 10, 5); // 2025-11-05
  
  let basePrice = 400000;
  
  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 7)) {
    const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
    
    basePrice += (Math.random() - 0.3) * 15000;
    basePrice = Math.max(380000, Math.min(480000, basePrice));
    
    const isFuture = d > today;
    
    data.push({
      date: dateStr,
      actualPrice: isFuture ? null : Math.round(basePrice),
      predictedPrice: Math.round(basePrice + (isFuture ? 20000 : 8000)),
      unopenedCondition: Math.round(basePrice * 1.08),
      openedCondition: Math.round(basePrice * 0.92),
    });
  }
  
  // 미래 예측 추가
  for (let i = 1; i <= 4; i++) {
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + (i * 7));
    const dateStr = `${futureDate.getMonth() + 1}/${futureDate.getDate()}`;
    
    basePrice += 8000;
    
    data.push({
      date: dateStr,
      actualPrice: null,
      predictedPrice: Math.round(basePrice + 20000),
      unopenedCondition: Math.round((basePrice + 20000) * 1.08),
      openedCondition: Math.round((basePrice + 20000) * 0.92),
    });
  }
  
  return data;
}

// 월별 데이터 생성 함수
function generateMonthlyData(months: number): PriceData[] {
  const data: PriceData[] = [];
  const startMonth = 12 - months; // 6개월이면 6월부터, 12개월이면 12월부터
  const startYear = startMonth < 1 ? 2024 : 2025;
  const adjustedStartMonth = startMonth < 1 ? startMonth + 12 : startMonth;
  
  let basePrice = months === 12 ? 350000 : 380000;
  
  for (let i = 0; i < months; i++) {
    const monthIndex = adjustedStartMonth + i;
    const year = monthIndex > 12 ? startYear + 1 : startYear;
    const month = monthIndex > 12 ? monthIndex - 12 : monthIndex;
    
    const dateStr = `${year}-${String(month).padStart(2, '0')}`;
    
    basePrice += (Math.random() - 0.2) * 20000;
    basePrice = Math.max(350000, Math.min(480000, basePrice));
    
    data.push({
      date: dateStr,
      actualPrice: Math.round(basePrice),
      predictedPrice: Math.round(basePrice + 10000),
      unopenedCondition: Math.round(basePrice * 1.08),
      openedCondition: Math.round(basePrice * 0.92),
    });
  }
  
  // 현재 달 (2025-11)
  data.push({
    date: "2025-11",
    actualPrice: 450000,
    predictedPrice: 465000,
    unopenedCondition: 486000,
    openedCondition: 414000,
  });
  
  // 미래 예측 2개월
  data.push({
    date: "2025-12",
    actualPrice: null,
    predictedPrice: 480000,
    unopenedCondition: 518400,
    openedCondition: 441600,
  });
  
  data.push({
    date: "2026-01",
    actualPrice: null,
    predictedPrice: 495000,
    unopenedCondition: 534600,
    openedCondition: 455400,
  });
  
  return data;
}

export function ResellDetailPage({ productId, onNavigate }: ResellDetailPageProps) {
  const [showPredictedPrice, setShowPredictedPrice] = useState(true);
  const [showUnopenedCondition, setShowUnopenedCondition] = useState(false);
  const [showOpenedCondition, setShowOpenedCondition] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<"1m" | "3m" | "6m" | "1y">("6m");

  // Mock data - 실제로는 API에서 가져올 데이터
  const productInfo = {
    id: productId,
    name: "에어조던 1 레트로 하이 시카고",
    brand: "Nike",
    modelNumber: "555088-101",
    releaseDate: "2015-11-01",
    retailPrice: 189000,
    currentPrice: 450000,
    predictedNextPrice: 480000,
    changePercent: 7.1,
    image: "https://images.unsplash.com/photo-1558121556-2a39fc528338?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbmVha2VyJTIwcHJvZHVjdHxlbnwxfHx8fDE3NjIzMTA1OTF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  };

  // 기간별 데이터 생성
  const filteredPriceHistory = useMemo(() => {
    switch (selectedPeriod) {
      case "1m":
        return generateDailyData(); // 1일 단위
      case "3m":
        return generateWeeklyData(); // 1주일 단위
      case "6m":
        return generateMonthlyData(6); // 1달 단위
      case "1y":
        return generateMonthlyData(12); // 1달 단위
      default:
        return generateMonthlyData(6);
    }
  }, [selectedPeriod]);

  // 판매 매물
  const saleItems: SaleItem[] = [
    {
      id: "1",
      price: 445000,
      condition: "미착용 새제품",
      size: "270mm",
      location: "서울 강남구",
      seller: "신발매니아",
      sellerRating: 4.9,
      image: "https://images.unsplash.com/photo-1558121556-2a39fc528338?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbmVha2VyJTIwcHJvZHVjdHxlbnwxfHx8fDE3NjIzMTA1OTF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      postedAt: "1시간 전",
    },
    {
      id: "2",
      price: 450000,
      condition: "새제품",
      size: "275mm",
      location: "서울 서초구",
      seller: "리셀왕",
      sellerRating: 4.8,
      image: "https://images.unsplash.com/photo-1558121556-2a39fc528338?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbmVha2VyJTIwcHJvZHVjdHxlbnwxfHx8fDE3NjIzMTA1OTF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      postedAt: "3시간 전",
    },
    {
      id: "3",
      price: 455000,
      condition: "미착용",
      size: "265mm",
      location: "경기 성남시",
      seller: "스니커헤드",
      sellerRating: 4.7,
      image: "https://images.unsplash.com/photo-1558121556-2a39fc528338?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbmVha2VyJTIwcHJvZHVjdHxlbnwxfHx8fDE3NjIzMTA1OTF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      postedAt: "5시간 전",
    },
    {
      id: "4",
      price: 460000,
      condition: "새제품",
      size: "280mm",
      location: "서울 송파구",
      seller: "조던콜렉터",
      sellerRating: 5.0,
      image: "https://images.unsplash.com/photo-1558121556-2a39fc528338?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbmVha2VyJTIwcHJvZHVjdHxlbnwxfHx8fDE3NjIzMTA1OTF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      postedAt: "1일 전",
    },
  ];

  // Custom Tooltip for chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="text-sm mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: ₩{entry.value?.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center gap-4 px-4 py-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate("resell")}
              className="shrink-0"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="truncate">{productInfo.name}</h1>
              <p className="text-sm text-muted-foreground">{productInfo.brand}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="ghost" size="icon">
                <Share2 className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Heart className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-6">
        {/* Product Quick Info - 최상단으로 이동 */}
        <div className="mb-8">
          <div className="space-y-6">
            <div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl text-primary">
                  ₩{productInfo.currentPrice.toLocaleString()}
                </span>
                <div
                  className={`flex items-center gap-1 ${
                    productInfo.changePercent > 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {productInfo.changePercent > 0 ? (
                    <ArrowUp className="h-4 w-4" />
                  ) : (
                    <ArrowDown className="h-4 w-4" />
                  )}
                  <span className="text-sm">{Math.abs(productInfo.changePercent)}%</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">현재 시세 (평균가)</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-secondary rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">발매가</p>
                <p className="text-lg">₩{productInfo.retailPrice.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-secondary rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">AI 예측가</p>
                <p className="text-lg text-primary">
                  ₩{productInfo.predictedNextPrice.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">모델 번호</span>
                <span>{productInfo.modelNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">발매일</span>
                <span>{productInfo.releaseDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Price Chart */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-col gap-4">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                시세 차트
              </CardTitle>
              
              {/* Period Tabs */}
              <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as any)}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="1m">1개월</TabsTrigger>
                  <TabsTrigger value="3m">3개월</TabsTrigger>
                  <TabsTrigger value="6m">6개월</TabsTrigger>
                  <TabsTrigger value="1y">1년</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Condition Switches */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="predicted-price"
                    checked={showPredictedPrice}
                    onCheckedChange={setShowPredictedPrice}
                  />
                  <Label htmlFor="predicted-price" className="text-sm cursor-pointer">
                    AI 예측
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="unopened-condition"
                    checked={showUnopenedCondition}
                    onCheckedChange={setShowUnopenedCondition}
                  />
                  <Label htmlFor="unopened-condition" className="text-sm cursor-pointer">
                    미개봉
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="opened-condition"
                    checked={showOpenedCondition}
                    onCheckedChange={setShowOpenedCondition}
                  />
                  <Label htmlFor="opened-condition" className="text-sm cursor-pointer">
                    개봉
                  </Label>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={filteredPriceHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  angle={selectedPeriod === "1m" ? -45 : 0}
                  textAnchor={selectedPeriod === "1m" ? "end" : "middle"}
                  height={selectedPeriod === "1m" ? 60 : 30}
                />
                <YAxis
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `₩${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="actualPrice"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981", r: 4 }}
                  activeDot={{ r: 6 }}
                  name="실제 시세"
                  connectNulls={false}
                />
                {showPredictedPrice && (
                  <Line
                    type="monotone"
                    dataKey="predictedPrice"
                    stroke="#fb923c"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: "#fb923c", r: 4 }}
                    activeDot={{ r: 6 }}
                    name="AI 예측"
                  />
                )}
                {showUnopenedCondition && (
                  <Line
                    type="monotone"
                    dataKey="unopenedCondition"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6", r: 4 }}
                    activeDot={{ r: 6 }}
                    name="미개봉"
                  />
                )}
                {showOpenedCondition && (
                  <Line
                    type="monotone"
                    dataKey="openedCondition"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ fill: "#8b5cf6", r: 4 }}
                    activeDot={{ r: 6 }}
                    name="개봉"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              * 차트 위에 마우스를 올리거나 터치하면 상세 가격을 확인할 수 있습니다
            </p>
          </CardContent>
        </Card>

        {/* AI Market Forecast & Insights */}
        <Card className="mb-8 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              AI 시세 전망
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Forecast Summary */}
            <div className="flex items-start gap-4 p-4 bg-background rounded-lg border">
              <div className="shrink-0 w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">향후 1개월 예상</h3>
                  <Badge className="bg-green-500">상승</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  예상 가격: <span className="text-foreground font-medium">₩465,000 ~ ₩480,000</span>
                </p>
              </div>
            </div>

            {/* Key Insights */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">주요 분석 포인트</h4>
              <div className="space-y-2">
                <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                  <div className="shrink-0 w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center mt-0.5">
                    <span className="text-blue-500 text-xs">1</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">재발매 소식 없음 - 희소성 유지</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                  <div className="shrink-0 w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center mt-0.5">
                    <span className="text-blue-500 text-xs">2</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">최근 30일 거래량 15% 증가 - 수요 상승</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                  <div className="shrink-0 w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center mt-0.5">
                    <span className="text-blue-500 text-xs">3</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">시카고 컬러웨이 클래식 모델 - 안정적 가치</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                  <div className="shrink-0 w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center mt-0.5">
                    <span className="text-blue-500 text-xs">4</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">겨울 시즌 진입 - 스니커즈 거래 활성화 구간</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Investment Rating */}
            <div className="p-4 bg-background rounded-lg border-2 border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">투자 가치 평가</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= 4
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-gray-300 text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                현재 가격에서 <span className="text-primary font-medium">보유 추천</span> 상품입니다. 
                단기 시세 상승이 예상되며, 중장기 보유 시 안정적인 가치 유지가 가능합니다.
              </p>
            </div>

            {/* Risk Warning */}
            <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <p className="text-xs text-muted-foreground">
                ⚠️ 본 시세 분석은 과거 데이터와 AI 예측 모델을 기반으로 제공되며, 실제 거래 가격은 시장 상황에 따라 변동될 수 있습니다.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              최근 거래가
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-secondary rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>2025-11-03</span>
                </div>
                <div className="text-lg">₩448,000</div>
              </div>
              <div className="flex justify-between items-center p-3 bg-secondary rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>2025-11-02</span>
                </div>
                <div className="text-lg">₩450,000</div>
              </div>
              <div className="flex justify-between items-center p-3 bg-secondary rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>2025-11-01</span>
                </div>
                <div className="text-lg">₩447,000</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}