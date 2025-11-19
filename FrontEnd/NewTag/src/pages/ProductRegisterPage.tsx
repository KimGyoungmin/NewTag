import { useMemo, useRef, useState } from "react";
import { ChevronLeft, X, Camera, MapPin } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { CATEGORIES, IMAGE_CONFIG } from "../constants";
import { postApi } from "../api/postApi";
import { resolveImageUrl } from "../utils/image";
import { toast } from "sonner";
import { LocationPicker } from "../components/LocationPicker";

interface ProductRegisterPageProps {
  onNavigate: (page: string, id?: string) => void;
}

const DEFAULT_LATITUDE = 37.4979;
const DEFAULT_LONGITUDE = 127.0276;

export function ProductRegisterPage({ onNavigate }: ProductRegisterPageProps) {
  const [images, setImages] = useState<string[]>([]);

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("강남구청역 3번 출구");
  const [isResell, setIsResell] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAutoWriting, setIsAutoWriting] = useState(false);


  const fileInputRef = useRef<HTMLInputElement>(null);

  const categoryOptions = useMemo(
    () =>
      CATEGORIES.map(({ id, name, emoji }) => ({
        value: id.toString(),
        label: `${emoji ?? ""} ${name}`.trim(),
      })),
    []
  );

  const handleImageButtonClick = () => {
    if (images.length >= 10) {
      toast.error("이미지는 최대 10장까지 등록할 수 있습니다.");
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (images.length >= 10) {
      toast.error("이미지는 최대 10장까지 등록할 수 있습니다.");
      event.target.value = "";
      return;
    }

    try {
      setIsUploading(true);
      const result = await postApi.uploadImage(file);
      setImages((prev) => [...prev, result.path]);
      toast.success("이미지가 업로드되었습니다.");
    } catch (error) {
      console.error("Failed to upload image:", error);
      toast.error("이미지 업로드에 실패했습니다.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleImageRemove = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };


  const getImagePreview = (path: string) => {
    return resolveImageUrl(path);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const priceValue = parseInt(price, 10);
    if (Number.isNaN(priceValue) || priceValue <= 0) {
      toast.error("올바른 가격을 입력해 주세요.");
      return;
    }

    if (!categoryId) {
      toast.error("카테고리를 선택해 주세요.");
      return;
    }

    const imagePayload =
      images.length > 0
        ? images.map((image, index) => ({
            path: image,
            isMain: index === 0,
          }))
        : [
            {
              path: IMAGE_CONFIG.DEFAULT_PRODUCT,
              isMain: true,
            },
          ];

    const payload = {
      title,
      content: description || title,
      price: priceValue,
      categoryId: Number(categoryId),
      locationNm: location,
      latitude: DEFAULT_LATITUDE,
      longitude: DEFAULT_LONGITUDE,
      images: imagePayload,
      isResell,
    };

    try {
      setIsSubmitting(true);
      const result = await postApi.create(payload);
      toast.success("게시글이 등록되었습니다.");

      if (result?.id) {
        onNavigate("detail", String(result.id));
      } else {
        onNavigate("home");
      }
    } catch (error) {
      console.error("Failed to create post:", error);
      toast.error("게시글 등록에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutoWrite = async () => {
    if (isAutoWriting) return;
    if (images.length === 0) {
      toast.error("AI 자동 작성을 사용하려면 이미지를 먼저 업로드해주세요.");
      return;
    }
    try {
      setIsAutoWriting(true);
      const result = await postApi.autoWrite(images);
      if (result.title) {
        setTitle(result.title);
      }
      if (result.content) {
        setDescription(result.content);
      }
      if (result.price && result.price > 0) {
        setPrice(result.price.toString());
      }
      if (result.categoryId) {
        setCategoryId(result.categoryId.toString());
      } else if (result.categoryName) {
        toast.info(`추천 카테고리: ${result.categoryName}`);
      }
      toast.success("AI가 작성 내용을 불러왔어요.");
    } catch (error) {
      console.error("Failed to auto write:", error);
      toast.error("AI 자동 작성에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsAutoWriting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-50 flex items-center justify-between border-b bg-background px-4 h-14">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate("home")}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2>상품 등록</h2>
        <div className="w-10" />
      </div>

      <div className="container mx-auto max-w-2xl px-4 py-6 space-y-6">
        <div>
          <Label className="mb-3 block">상품 유형</Label>
          <div className="inline-flex items-center gap-2 rounded-full bg-muted p-1">
            <Button
              type="button"
              variant={isResell ? "ghost" : "default"}
              className={`flex-1 rounded-full ${!isResell ? "" : "bg-transparent"}`}
              onClick={() => setIsResell(false)}
            >
              일반
            </Button>
            <Button
              type="button"
              variant={!isResell ? "ghost" : "default"}
              className={`flex-1 rounded-full ${isResell ? "" : "bg-transparent"}`}
              onClick={() => setIsResell(true)}
            >
              리셀
            </Button>
          </div>
        </div>

        <div>
          <Label className="mb-3 block">상품 이미지</Label>
          <div className="flex gap-3 overflow-x-auto pb-2">
            <button
              onClick={handleImageButtonClick}
              className="flex h-24 w-24 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed bg-muted transition-colors hover:bg-muted/80 disabled:opacity-60"
              disabled={isUploading}
            >
              <Camera className="h-6 w-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {isUploading ? "업로드 중..." : `${images.length}/10`}
              </span>
            </button>
            {images.map((image, index) => (
              <div key={index} className="relative h-24 w-24 shrink-0">
                <img
                  src={getImagePreview(image)}
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
            첫 번째 이미지는 자동으로 대표 이미지로 설정됩니다.
          </p>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-dashed px-4 py-3">
          <div>
            <p className="text-sm font-semibold">AI 자동 작성</p>
            <p className="text-xs text-muted-foreground">업로드한 첫 번째 이미지를 기반으로 제목 · 내용 · 가격 · 카테고리를 추천해 드립니다.</p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={handleAutoWrite}
            disabled={isAutoWriting || images.length === 0}
          >
            {isAutoWriting ? "생성 중..." : "AI 자동 작성"}
          </Button>
        </div>

        <div>
          <Label htmlFor="title">제목</Label>
          <Input
            id="title"
            placeholder="상품 제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="category">카테고리</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="카테고리를 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              원
            </span>
          </div>
        </div>

        <div>
          <Label htmlFor="description">상품 설명</Label>
          <Textarea
            id="description"
            placeholder="상품에 대한 상세 설명을 작성해 주세요."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-2 min-h-[200px]"
          />
        </div>

        <div>
          <Label htmlFor="location">거래 희망 장소</Label>
          <div className="mt-2 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />

            <span>{location}</span>
            <Button variant="link" size="sm" className="ml-auto" disabled>
              변경
            </Button>
          </div>
        </div>
      </div>


      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background p-4">
        <div className="container mx-auto max-w-2xl">
          <Button
            className="w-full bg-primary hover:bg-primary-hover"
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              isAutoWriting ||
              !title ||
              !categoryId ||
              !price
            }
          >
            {isSubmitting ? "등록 중..." : "작성 완료"}
          </Button>
        </div>
      </div>
    </div>
  );
}





