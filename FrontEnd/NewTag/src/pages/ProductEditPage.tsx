import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, Camera, X, Sparkles } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";
import { productApi, UpdateProductRequest } from "../api/productApi";
import { postApi } from "../api/postApi";
import { categoryApi, Category } from "../api/categoryApi";
import { authApi } from "../api/auth";
import { resolveImageUrl } from "../utils/image";
import type { Product } from "../types";

interface ProductEditPageProps {
  productId: string;
  onNavigate: (page: string, id?: string) => void;
}

type EditableImage = { path: string; isMain?: boolean };

type EditFormState = {
  title: string;
  categoryId: string;
  price: string;
  description: string;
  images: EditableImage[];
  isResell: boolean;
  location: string;
  latitude: number;
  longitude: number;
};

const DEFAULT_LATITUDE = 37.4979;
const DEFAULT_LONGITUDE = 127.0276;

export function ProductEditPage({ productId, onNavigate }: ProductEditPageProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<EditableImage[]>([]);
  const [isResell, setIsResell] = useState(false);
  const [location, setLocation] = useState("강남구청역 3번 출구");
  const [latitude, setLatitude] = useState(DEFAULT_LATITUDE);
  const [longitude, setLongitude] = useState(DEFAULT_LONGITUDE);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const locationState = routerLocation.state as {
    selectedLocation?: { locationName: string; latitude: number; longitude: number };
    formState?: EditFormState;
  } | null;

  const categoryOptions = useMemo(
    () =>
      categories.map((cat) => ({
        value: cat.id.toString(),
        label: cat.categoryNm,
      })),
    [categories]
  );

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const data = await categoryApi.getAllCategories();
        const uniqueCategories = data.filter((category, index, self) =>
          index === self.findIndex((c) => c.id === category.id)
        );
        setCategories(uniqueCategories);
      } catch (err) {
        console.error("Failed to load categories:", err);
        toast.error("카테고리를 불러오는데 실패했습니다.");
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const loadProduct = async () => {
      const numericId = Number(productId);
      if (Number.isNaN(numericId)) {
        setError("잘못된 상품 ID 입니다.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const detail = await productApi.getById(numericId, authApi.getCurrentUser()?.id);
        if (!detail) {
          setError("상품 정보를 불러오지 못했습니다.");
          return;
        }

        hydrateForm(detail);
      } catch (err) {
        console.error("Failed to load product:", err);
        setError("상품 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  useEffect(() => {
    const formState = locationState?.formState;
    if (!formState) return;

    setTitle(formState.title ?? "");
    setCategoryId(formState.categoryId ?? "");
    setPrice(formState.price ?? "");
    setDescription(formState.description ?? "");
    setImages(formState.images ?? []);
    setIsResell(!!formState.isResell);
    setLocation(formState.location ?? location);
    setLatitude(formState.latitude ?? DEFAULT_LATITUDE);
    setLongitude(formState.longitude ?? DEFAULT_LONGITUDE);
  }, [locationState?.formState]);

  useEffect(() => {
    if (locationState?.selectedLocation) {
      const { locationName, latitude, longitude } = locationState.selectedLocation;
      setLocation(locationName);
      setLatitude(latitude);
      setLongitude(longitude);
      navigate(`/product-edit/${productId}`, { replace: true });
    }
  }, [locationState?.selectedLocation, navigate, productId]);

  const hydrateForm = (product: Product) => {
    setTitle(product.title || "");
    setCategoryId(product.categoryId ? product.categoryId.toString() : "");
    setPrice(product.price?.toString() ?? "");
    setDescription(product.content || "");
    setLocation(product.locationNm || "강남구청역 3번 출구");
    setLatitude(product.latitude ?? DEFAULT_LATITUDE);
    setLongitude(product.longitude ?? DEFAULT_LONGITUDE);
    setIsResell(product.isResell ?? false);
    setImages(
      (product.images || []).map((img) => ({
        path: img.pImg,
        isMain: img.isMain,
      }))
    );
  };

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
      setImages((prev) => ensureMainFlag([...prev, { path: result.path }]));
      toast.success("이미지가 업로드되었습니다.");
    } catch (err) {
      console.error("Failed to upload image:", err);
      const message = err instanceof Error ? err.message : "이미지 업로드에 실패했습니다.";
      toast.error(message);
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const ensureMainFlag = (list: EditableImage[]) => {
    if (list.length === 0) return list;
    const hasMain = list.some((img) => img.isMain);
    if (!hasMain) {
      return list.map((img, idx) => ({ ...img, isMain: idx === 0 }));
    }
    return list;
  };

  const handleSetMainImage = (index: number) => {
    setImages((prev) =>
      prev.map((img, idx) => ({
        ...img,
        isMain: idx === index,
      }))
    );
  };

  const handleImageRemove = (index: number) => {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return ensureMainFlag(next);
    });
  };

  const handleSubmit = async () => {
    if (saving) return;

    const numericId = Number(productId);
    if (Number.isNaN(numericId)) {
      toast.error("잘못된 상품 ID 입니다.");
      return;
    }

    const priceValue = parseInt(price, 10);
    if (Number.isNaN(priceValue) || priceValue <= 0) {
      toast.error("올바른 가격을 입력해 주세요.");
      return;
    }

    if (!title.trim()) {
      toast.error("제목을 입력해 주세요.");
      return;
    }

    if (!categoryId) {
      toast.error("카테고리를 선택해 주세요.");
      return;
    }

    const payload: UpdateProductRequest = {
      title: title.trim(),
      content: description || title.trim(),
      price: priceValue,
      categoryId: Number(categoryId),
      locationNm: location,
      latitude,
      longitude,
      isResell,
      images: ensureMainFlag(images).map((img, index) => ({
        path: img.path,
        isMain: img.isMain ?? index === 0,
      })),
    };

    try {
      setSaving(true);
      const updated = await productApi.update(numericId, payload);
      if (updated?.id) {
        toast.success("상품이 수정되었습니다.");
        onNavigate("detail", updated.id.toString());
      } else {
        toast.success("상품이 수정되었습니다.");
        onNavigate("home");
      }
    } catch (err) {
      console.error("Failed to update product:", err);
      toast.error("상품 수정에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  };

  const handleLocationChange = () => {
    const formState: EditFormState = {
      title,
      categoryId,
      price,
      description,
      images,
      isResell,
      location,
      latitude,
      longitude,
    };

    navigate("/product/location", {
      state: {
        formState,
        currentLocation: {
          locationName: location,
          latitude,
          longitude,
        },
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-8">
        <div className="sticky top-0 z-50 flex items-center justify-between border-b bg-background px-4 h-14">
          <Button variant="ghost" size="icon" onClick={() => onNavigate("home")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2>상품 수정</h2>
          <div className="w-10" />
        </div>
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          상품 정보를 불러오는 중입니다...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-8">
        <div className="sticky top-0 z-50 flex items-center justify-between border-b bg-background px-4 h-14">
          <Button variant="ghost" size="icon" onClick={() => onNavigate("home")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2>상품 수정</h2>
          <div className="w-10" />
        </div>
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-50 flex items-center justify-between border-b bg-background px-4 h-14">
        <Button variant="ghost" size="icon" onClick={() => onNavigate("detail", productId)}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2>상품 수정</h2>
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
              <div key={`${image.path}-${index}`} className="relative h-24 w-24 shrink-0">
                <img
                  src={resolveImageUrl(image.path)}
                  alt={`Upload ${index + 1}`}
                  className="h-full w-full rounded-xl object-cover"
                />
                <button
                  onClick={() => handleImageRemove(index)}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-background"
                >
                  <X className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleSetMainImage(index)}
                  className={`absolute left-1 bottom-1 rounded px-2 py-0.5 text-xs ${
                    image.isMain ? "bg-primary text-white" : "bg-black/60 text-white"
                  }`}
                >
                  대표
                </button>
              </div>
            ))}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            첫 번째 이미지는 자동으로 대표 이미지로 설정됩니다.
          </p>
          <input
            type="file"
            accept=".jpg,.jpeg,.jfif,.png,.gif,.webp,.bmp,.tiff,.tif"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-dashed px-4 py-3">
          <div>
            <p className="text-sm font-semibold">AI 추천 내용으로 빠르게 수정</p>
            <p className="text-xs text-muted-foreground">
              등록된 이미지를 기반으로 제목 · 내용 · 가격 · 카테고리를 다시 추천받을 수 있습니다.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => onNavigate("product/register")}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            새 글로 AI 작성
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
          <Select value={categoryId} onValueChange={setCategoryId} disabled={loadingCategories}>
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
            <span>{location}</span>
            <Button variant="link" size="sm" className="ml-auto" onClick={handleLocationChange}>
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
            disabled={saving || isUploading || !title || !categoryId || !price}
          >
            {saving ? "수정 중..." : "수정 완료"}
          </Button>
        </div>
      </div>
    </div>
  );
}
