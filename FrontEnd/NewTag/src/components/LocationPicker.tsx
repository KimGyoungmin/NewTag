import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { KakaoMap } from './KakaoMap';
import { getCurrentPosition, getAddressFromCoords } from '../utils/kakaoMap';
import { MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface LocationPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (location: {
    latitude: number;
    longitude: number;
    locationName: string;
  }) => void;
  initialLatitude?: number;
  initialLongitude?: number;
  initialLocationName?: string;
}

export const LocationPicker = ({
  open,
  onClose,
  onSelect,
  initialLatitude,
  initialLongitude,
  initialLocationName,
}: LocationPickerProps) => {
  const [latitude, setLatitude] = useState(initialLatitude || 37.5665);
  const [longitude, setLongitude] = useState(initialLongitude || 126.9780);
  const [locationName, setLocationName] = useState(
    initialLocationName || '서울특별시 중구 명동'
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialLatitude && initialLongitude) {
      setLatitude(initialLatitude);
      setLongitude(initialLongitude);
      setLocationName(initialLocationName || '');
    }
  }, [initialLatitude, initialLongitude, initialLocationName]);

  // 현재 위치 가져오기
  const handleGetCurrentLocation = async () => {
    setLoading(true);
    try {
      const position = await getCurrentPosition();
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      setLatitude(lat);
      setLongitude(lng);

      // 주소 가져오기
      const address = await getAddressFromCoords(lat, lng);
      setLocationName(address);

      toast.success('현재 위치를 가져왔습니다.');
    } catch (error) {
      console.error('위치 가져오기 실패:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : '위치를 가져오는데 실패했습니다.'
      );
    } finally {
      setLoading(false);
    }
  };

  // 지도 클릭으로 위치 변경
  const handleLocationChange = (lat: number, lng: number, address: string) => {
    setLatitude(lat);
    setLongitude(lng);
    setLocationName(address);
  };

  // 선택 완료
  const handleConfirm = () => {
    onSelect({
      latitude,
      longitude,
      locationName,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>거래 위치 선택</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 현재 위치 버튼 */}
          <Button
            onClick={handleGetCurrentLocation}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                위치 가져오는 중...
              </>
            ) : (
              <>
                <MapPin className="mr-2 h-4 w-4" />
                현재 위치로 설정
              </>
            )}
          </Button>

          {/* 선택된 위치 정보 */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-1">선택된 위치</p>
            <p className="text-sm text-muted-foreground">{locationName}</p>
            <p className="text-xs text-muted-foreground mt-1">
              위도: {latitude.toFixed(6)}, 경도: {longitude.toFixed(6)}
            </p>
          </div>

          {/* 카카오 맵 */}
          <div className="border rounded-lg overflow-hidden">
            <KakaoMap
              latitude={latitude}
              longitude={longitude}
              locationName={locationName}
              height="400px"
              level={3}
              draggable={true}
              zoomable={true}
              onLocationChange={handleLocationChange}
              showMarker={true}
            />
          </div>

          <p className="text-sm text-muted-foreground text-center">
            지도를 클릭하여 거래 위치를 선택하세요
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleConfirm}>선택 완료</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
