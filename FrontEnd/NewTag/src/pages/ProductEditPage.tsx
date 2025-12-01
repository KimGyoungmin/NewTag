import { useState, useEffect } from "react";
import { ChevronLeft, X, Plus } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";
import { getProductById, updateProduct } from "../utils/localStorage";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

interface ProductEditPageProps {
  productId: string;
  onNavigate: (page: string) => void;
}

export function ProductEditPage({ productId, onNavigate }: ProductEditPageProps) {
  const product = getProductById(productId);
  
  const [title, setTitle] = useState(product?.title || "");
  const [price, setPrice] = useState(product?.price.toString() || "");
  const [category, setCategory] = useState(product?.category || "electronics");
  const [description, setDescription] = useState(product?.description || "");
  const [location, setLocation] = useState(product?.location || "강남구 역삼동");

  useEffect(() => {
    if (product) {
      setTitle(product.title);
      setPrice(product.price.toString());
      setCategory(product.category);
      setDescription(product.description || "");
      setLocation(product.location);
    }
  }, [product]);

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("상품명을 입력해주세요");
      return;
    }

    if (!price.trim() || isNaN(Number(price))) {
      toast.error("가격을 정확히 입력해주세요");
      return;
    }

    if (!description.trim()) {
      toast.error("상품 설명을 입력해주세요");
      return;
    }

    updateProduct(productId, {
      title: title.trim(),
      price: Number(price),
      category,
      description: description.trim(),
      location,
    });

    toast.success("상품이 수정되었습니다");
    onNavigate("mypage");
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-background">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => onNavigate("mypage")}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h1>상품 수정</h1>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">상품을 찾을 수 없습니다</p>
        </div>
      </div>
    );
  }

  const categories = [
    { value: "electronics", label: "전자기기" },
    { value: "furniture", label: "가구/인테리어" },
    { value: "fashion", label: "의류/잡화" },
    { value: "books", label: "도서" },
    { value: "sports", label: "스포츠/레저" },
    { value: "other", label: "기타" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => onNavigate("mypage")}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h1>상품 수정</h1>
            </div>
            <Button onClick={handleSubmit}>완료</Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 py-6">
        {/* Images */}
        <div className="mb-6">
          <Label>상품 이미지</Label>
          <div className="mt-2 grid grid-cols-3 gap-3">
            {product.images?.map((img, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                <ImageWithFallback
                  src={img}
                  alt={`상품 이미지 ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {!product.images && (
              <div className="relative aspect-square rounded-lg overflow-hidden border">
                <ImageWithFallback
                  src={product.image}
                  alt="상품 이미지"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            * 이미지 변경은 현재 지원하지 않습니다
          </p>
        </div>

        {/* Title */}
        <div className="mb-6">
          <Label htmlFor="title">상품명</Label>
          <Input
            id="title"
            type="text"
            placeholder="상품명을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-2"
          />
        </div>

        {/* Category */}
        <div className="mb-6">
          <Label htmlFor="category">카테고리</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="카테고리 선택" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Price */}
        <div className="mb-6">
          <Label htmlFor="price">가격</Label>
          <div className="relative mt-2">
            <Input
              id="price"
              type="text"
              placeholder="가격을 입력하세요"
              value={price}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, "");
                setPrice(value);
              }}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              원
            </span>
          </div>
        </div>

        {/* Location */}
        <div className="mb-6">
          <Label htmlFor="location">거래 희망 장소</Label>
          <Input
            id="location"
            type="text"
            placeholder="예) 강남구 역삼동"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="mt-2"
          />
        </div>

        {/* Description */}
        <div className="mb-6">
          <Label htmlFor="description">상품 설명</Label>
          <Textarea
            id="description"
            placeholder="상품 설명을 입력하세요"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-2 min-h-[200px]"
          />
          <p className="text-xs text-muted-foreground mt-2">
            {description.length} / 1000자
          </p>
        </div>
      </div>
    </div>
  );
}
