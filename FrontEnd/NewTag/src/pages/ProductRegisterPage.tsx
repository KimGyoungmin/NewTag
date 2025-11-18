import { useState } from "react";
import { ChevronLeft, X, Camera, MapPin } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { addProduct } from "../utils/localStorage";
import { toast } from "sonner";
import { LocationPicker } from "../components/LocationPicker";

interface ProductRegisterPageProps {
  onNavigate: (page: string) => void;
}

export function ProductRegisterPage({ onNavigate }: ProductRegisterPageProps) {
  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('강남구 역삼동');
  const [latitude, setLatitude] = useState<number>(37.5665);
  const [longitude, setLongitude] = useState<number>(126.9780);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const handleImageAdd = () => {
    // Simulated image upload
    if (images.length < 10) {
      setImages([...images, `https://images.unsplash.com/photo-1758186355698-bd0183fc75ed?w=400`]);
    }
  };

  const handleImageRemove = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleLocationSelect = (locationData: {
    latitude: number;
    longitude: number;
    locationName: string;
  }) => {
    setLatitude(locationData.latitude);
    setLongitude(locationData.longitude);
    setLocation(locationData.locationName);
  };

  const handleSubmit = () => {
    // Validate and convert price
    const priceValue = parseInt(price);
    if (isNaN(priceValue) || priceValue < 0) {
      toast.error("올바른 가격을 입력해주세요");
      return;
    }

    // Create product
    addProduct({
      image: images[0],
      images,
      title,
      category,
      price: priceValue,
      description,
      location,
      status: 'available',
    });
    
    toast.success("상품이 등록되었습니다!");
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
        <h2>상품 등록</h2>
        <div className="w-10"></div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 py-6 space-y-6">
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

        {/* Title */}
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

        {/* Category */}
        <div>
          <Label htmlFor="category">카테고리</Label>
          <Select value={category} onValueChange={setCategory}>
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
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              원
            </span>
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
            className="mt-2 min-h-[200px]"
          />
        </div>

        {/* Location */}
        <div>
          <Label htmlFor="location">거래 희망 장소</Label>
          <div className="mt-2 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <span className="flex-1 text-sm">{location}</span>
            <Button
              variant="link"
              size="sm"
              className="ml-auto"
              onClick={() => setShowLocationPicker(true)}
            >
              변경
            </Button>
          </div>
        </div>
      </div>

      {/* Location Picker Dialog */}
      <LocationPicker
        open={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onSelect={handleLocationSelect}
        initialLatitude={latitude}
        initialLongitude={longitude}
        initialLocationName={location}
      />

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background p-4">
        <div className="container mx-auto max-w-2xl">
          <Button 
            className="w-full bg-primary hover:bg-primary-hover"
            onClick={handleSubmit}
            disabled={!title || !category || !price || images.length === 0}
          >
            작성완료
          </Button>
        </div>
      </div>
    </div>
  );
}