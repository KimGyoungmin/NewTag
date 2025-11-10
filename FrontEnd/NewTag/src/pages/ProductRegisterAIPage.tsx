import { useState } from "react";
import { ChevronLeft, X, Camera, Sparkles, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";

interface ProductRegisterAIPageProps {
  onNavigate: (page: string) => void;
}

export function ProductRegisterAIPage({ onNavigate }: ProductRegisterAIPageProps) {
  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('강남구 역삼동');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);

  const handleImageAdd = () => {
    // Simulated image upload
    if (images.length < 10) {
      const newImages = [
        'https://images.unsplash.com/photo-1758186355698-bd0183fc75ed?w=400',
        'https://images.unsplash.com/photo-1579535984712-92fffbbaa266?w=400',
        'https://images.unsplash.com/photo-1634824506573-4a430d1d6111?w=400',
      ];
      setImages([...images, newImages[images.length % 3]]);
    }
  };

  const handleImageRemove = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    // Reset generated content if images are removed
    if (isGenerated) {
      setIsGenerated(false);
    }
  };

  const handleAIGenerate = async () => {
    if (images.length === 0) {
      return;
    }

    setIsGenerating(true);

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock AI-generated content based on images
    const generatedData = {
      title: '아이패드 프로 11인치 M2칩 (2022) - 거의 새것',
      category: 'electronics',
      price: '850000',
      description: `거의 새 제품으로, 사용 기간은 약 3개월 정도입니다.

📱 상품 정보:
- 모델: 아이패드 프로 11인치 (2022)
- 칩셋: M2 칩
- 색상: 스페이스 그레이
- 용량: 128GB

📦 구성품:
- 아이패드 프로 본체
- 정품 충전기 및 케이블
- 애플 펜슬 2세대 (추가)
- 보호 케이스 포함

✨ 상태:
케이스를 항상 착용하여 사용했기 때문에 스크래치가 거의 없습니다.
액정 보호필름이 부착되어 있으며, 동작에 이상 없습니다.

💰 가격:
850,000원 (가격 제안 가능)

📍 거래 방법:
- 직거래 우선 (강남구 역삼동 인근)
- 택배 거래 가능 (착불)

궁금하신 점 있으시면 채팅 주세요!`
    };

    setTitle(generatedData.title);
    setCategory(generatedData.category);
    setPrice(generatedData.price);
    setDescription(generatedData.description);
    setIsGenerating(false);
    setIsGenerated(true);
  };

  const handleSubmit = () => {
    // Handle product submission
    onNavigate('home');
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 flex items-center justify-between border-b bg-background px-4 h-14">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => onNavigate('home')}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2>AI 자동 작성</h2>
        </div>
        <div className="w-10"></div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 py-6 space-y-6">
        {/* AI Banner */}
        <div className="rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 p-4 border border-primary/20">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="mb-1">AI가 판매글을 작성해드려요</h3>
              <p className="text-sm text-muted-foreground">
                상품 사진을 올리고 'AI 자동 작성' 버튼을 누르면 AI가 제목, 가격, 설명을 자동으로 생성합니다.
                생성된 내용은 수정할 수 있어요.
              </p>
            </div>
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <Label className="mb-3 block">상품 이미지</Label>
          <div className="flex gap-3 overflow-x-auto pb-2">
            <button
              onClick={handleImageAdd}
              className="flex h-24 w-24 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed bg-muted transition-colors hover:bg-muted/80"
            >
              <Camera className="h-6 w-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {images.length}/10
              </span>
            </button>
            {images.map((image, index) => (
              <div key={index} className="relative h-24 w-24 shrink-0">
                <img
                  src={image}
                  alt={`Upload ${index + 1}`}
                  className="h-full w-full rounded-xl object-cover"
                />
                <button
                  onClick={() => handleImageRemove(index)}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-background"
                >
                  <X className="h-4 w-4" />
                </button>
                {index === 0 && (
                  <div className="absolute bottom-1 left-1 rounded bg-primary px-2 py-0.5 text-xs text-white">
                    대표
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            첫 번째 사진이 대표 이미지입니다.
          </p>
        </div>

        {/* AI Generate Button */}
        {images.length > 0 && !isGenerated && (
          <Button 
            className="w-full bg-primary hover:bg-primary-hover"
            onClick={handleAIGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                AI가 분석 중입니다...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                AI로 자동 작성하기
              </>
            )}
          </Button>
        )}

        {isGenerated && (
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
            <div className="flex items-center gap-2 text-sm text-primary">
              <Sparkles className="h-4 w-4" />
              <span>AI가 내용을 생성했어요. 수정 후 등록하세요!</span>
            </div>
          </div>
        )}

        {/* Title */}
        <div>
          <Label htmlFor="title">제목</Label>
          <Input
            id="title"
            placeholder="상품 제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-2"
            disabled={isGenerating}
          />
        </div>

        {/* Category */}
        <div>
          <Label htmlFor="category">카테고리</Label>
          <Select value={category} onValueChange={setCategory} disabled={isGenerating}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="카테고리를 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="electronics">전자기기</SelectItem>
              <SelectItem value="furniture">가구/인테리어</SelectItem>
              <SelectItem value="fashion">의류/잡화</SelectItem>
              <SelectItem value="sports">스포츠/레저</SelectItem>
              <SelectItem value="books">도서</SelectItem>
              <SelectItem value="beauty">뷰티/미용</SelectItem>
              <SelectItem value="toys">장난감/취미</SelectItem>
              <SelectItem value="etc">기타</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Price */}
        <div>
          <Label htmlFor="price">가격</Label>
          <div className="relative mt-2">
            <Input
              id="price"
              type="number"
              placeholder="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="pr-10"
              disabled={isGenerating}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              원
            </span>
          </div>
          <div className="mt-2 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPrice('무료나눔')}
              disabled={isGenerating}
            >
              무료나눔
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPrice('가격제안')}
              disabled={isGenerating}
            >
              가격제안 받기
            </Button>
          </div>
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">상품 설명</Label>
          <Textarea
            id="description"
            placeholder="상품에 대한 자세한 설명을 입력하세요"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-2 min-h-[300px]"
            disabled={isGenerating}
          />
        </div>

        {/* Location */}
        <div>
          <Label htmlFor="location">거래 희망 장소</Label>
          <div className="mt-2 flex items-center gap-2">
            <span>{location}</span>
            <Button variant="link" size="sm" className="ml-auto">
              변경
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background p-4">
        <div className="container mx-auto max-w-2xl">
          <Button 
            className="w-full bg-primary hover:bg-primary-hover"
            onClick={handleSubmit}
            disabled={!title || !category || !price || images.length === 0 || isGenerating}
          >
            등록하기
          </Button>
        </div>
      </div>
    </div>
  );
}
