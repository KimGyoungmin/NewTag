import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, LocateFixed, MapPin, Search } from "lucide-react";
import { KakaoMap } from "../components/KakaoMap";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { getAddressFromCoords, getCoordsFromAddress, getCurrentPosition } from "../utils/kakaoMap";
import { toast } from "sonner";
import { addressApi } from "../api/addressApi";
import { authApi } from "../api/auth";

const DEFAULT_LATITUDE = 37.5665;
const DEFAULT_LONGITUDE = 126.978;

export function AddressAddPage() {
  const navigate = useNavigate();

  const [latitude, setLatitude] = useState(DEFAULT_LATITUDE);
  const [longitude, setLongitude] = useState(DEFAULT_LONGITUDE);
  const [locationName, setLocationName] = useState("위치 정보를 불러오는 중입니다.");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const setCurrentLocation = async () => {
      setIsLocating(true);
      try {
        const position = await getCurrentPosition();
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const address = await getAddressFromCoords(lat, lng);

        setLatitude(lat);
        setLongitude(lng);
        setLocationName(address);
      } catch (error) {
        console.error("Failed to fetch current location:", error);
        toast.error("현재 위치를 가져올 수 없습니다. 직접 검색해 주세요.");
      } finally {
        setIsLocating(false);
      }
    };

    void setCurrentLocation();
  }, []);

  const handleCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const position = await getCurrentPosition();
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const address = await getAddressFromCoords(lat, lng);

      setLatitude(lat);
      setLongitude(lng);
      setLocationName(address);
      toast.success("현재 위치로 설정했습니다.");
    } catch (error) {
      console.error("Failed to fetch current location:", error);
      toast.error("현재 위치를 가져올 수 없습니다.");
    } finally {
      setIsLocating(false);
    }
  };

  const handleSearch = async () => {
    const query = searchQuery.trim();

    if (!query) {
      toast.error("검색어를 입력해 주세요.");
      return;
    }

    setIsSearching(true);
    try {
      const coords = await getCoordsFromAddress(query);
      const address = await getAddressFromCoords(coords.lat, coords.lng);

      setLatitude(coords.lat);
      setLongitude(coords.lng);
      setLocationName(address || query);
      toast.success("검색한 위치로 이동했습니다.");
    } catch (error) {
      console.error("Search failed:", error);
      toast.error("검색 결과를 찾지 못했습니다.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleMapLocationChange = (lat: number, lng: number, address: string) => {
    setLatitude(lat);
    setLongitude(lng);
    setLocationName(address);
  };

  const handleConfirm = async () => {
    const user = authApi.getCurrentUser();
    if (!user) {
      toast.error("로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    if (!locationName || !latitude || !longitude) {
      toast.error("위치를 선택해주세요.");
      return;
    }

    setIsSaving(true);
    try {
      await addressApi.addAddress({
        locationNm: locationName,
        latitude: latitude,
        longitude: longitude,
        isDefault: true, // 새로 추가하는 주소를 기본 주소로 설정
      });

      toast.success("위치가 저장되었습니다.");
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Failed to save address:", error);

      // 에러 메시지 파싱
      if (error instanceof Error) {
        if (error.message.includes("401")) {
          toast.error("로그인이 만료되었습니다. 다시 로그인해주세요.");
        } else if (error.message.includes("최대")) {
          toast.error("최대 3개의 위치만 저장할 수 있습니다.");
        } else {
          toast.error("위치 저장에 실패했습니다.");
        }
      } else {
        toast.error("위치 저장에 실패했습니다.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const isConfirmDisabled = !locationName || !latitude || !longitude || isSaving;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-50 flex items-center justify-between border-b bg-background px-4 h-14">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2>내 동네 추가</h2>
        <div className="w-10" />
      </div>

      <div className="container mx-auto max-w-2xl px-4 py-6 space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="원하시는 지역을 검색하세요"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleSearch();
              }
            }}
          />
          <Button onClick={handleSearch} disabled={isSearching}>
            <Search className="mr-2 h-4 w-4" />
            검색
          </Button>
        </div>

        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleCurrentLocation}
          disabled={isLocating}
        >
          <LocateFixed className="mr-2 h-4 w-4" />
          {isLocating ? "현재 위치 불러오는 중..." : "현재 위치로 설정"}
        </Button>

        <div className="rounded-lg border p-3 bg-muted/50 space-y-1">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <MapPin className="h-4 w-4 text-primary" />
            저장할 동네
          </div>
          <p className="text-sm text-foreground">{locationName}</p>
          <p className="text-xs text-muted-foreground">
            위도: {latitude.toFixed(6)}, 경도: {longitude.toFixed(6)}
          </p>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <KakaoMap
            latitude={latitude}
            longitude={longitude}
            locationName={locationName}
            height="420px"
            level={3}
            draggable
            zoomable
            onLocationChange={handleMapLocationChange}
            showMarker
          />
        </div>
        <p className="text-sm text-muted-foreground text-center">
          지도를 클릭해 저장할 위치를 선택하거나 검색 후 이동하세요.
        </p>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background p-4">
        <div className="container mx-auto max-w-2xl">
          <Button
            className="w-full bg-primary hover:bg-primary-hover"
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
          >
            {isSaving ? "저장 중..." : "이 위치로 저장"}
          </Button>
        </div>
      </div>
    </div>
  );
}
