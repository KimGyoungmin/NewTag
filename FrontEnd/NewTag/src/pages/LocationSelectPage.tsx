import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, LocateFixed, MapPin, Search } from "lucide-react";
import { KakaoMap } from "../components/KakaoMap";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { getAddressFromCoords, getCoordsFromAddress, getCurrentPosition } from "../utils/kakaoMap";
import { toast } from "sonner";

const DEFAULT_LATITUDE = 37.5665;
const DEFAULT_LONGITUDE = 126.978;

interface RegisterFormState {
  title: string;
  categoryId: string;
  price: string;
  description: string;
  images: string[];
  isResell: boolean;
  location: string;
  latitude: number;
  longitude: number;
}

interface LocationSelectState {
  currentLocation?: {
    locationName: string;
    latitude: number;
    longitude: number;
  };
  formState?: RegisterFormState;
}

export function LocationSelectPage() {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const locationState = routerLocation.state as LocationSelectState | null;
  const formState = locationState?.formState;

  const [latitude, setLatitude] = useState(locationState?.currentLocation?.latitude ?? DEFAULT_LATITUDE);
  const [longitude, setLongitude] = useState(locationState?.currentLocation?.longitude ?? DEFAULT_LONGITUDE);
  const [locationName, setLocationName] = useState(
    locationState?.currentLocation?.locationName ?? "위치 정보를 불러오는 중입니다."
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (locationState?.currentLocation) return;

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
  }, [locationState?.currentLocation]);

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

  const handleConfirm = () => {
    navigate("/product/register", {
      state: {
        selectedLocation: {
          locationName: locationName || searchQuery || "거래 위치",
          latitude,
          longitude,
        },
        formState,
      },
      replace: true,
    });
  };

  const isConfirmDisabled = !locationName || !latitude || !longitude;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-50 flex items-center justify-between border-b bg-background px-4 h-14">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2>거래 희망 장소</h2>
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
            거래 희망 장소
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
          지도를 클릭해 거래 위치를 선택하거나 검색 후 이동하세요.
        </p>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background p-4">
        <div className="container mx-auto max-w-2xl">
          <Button
            className="w-full bg-primary hover:bg-primary-hover"
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
          >
            위치 선택
          </Button>
        </div>
      </div>
    </div>
  );
}
