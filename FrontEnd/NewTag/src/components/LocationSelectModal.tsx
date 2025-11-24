import { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, Navigation } from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { addressApi, type Address } from '../api/addressApi';
import { authApi } from '../api/auth';
import { getCurrentPosition, getAddressFromCoords } from '../utils/kakaoMap';
import { toast } from 'sonner';

interface LocationSelectModalProps {
  open: boolean;
  onClose: () => void;
  onLocationChange: (location: Address | null) => void;
  onNavigateToLocationSelect: () => void;
}

export function LocationSelectModal({
  open,
  onClose,
  onLocationChange,
  onNavigateToLocationSelect,
}: LocationSelectModalProps) {
  const [savedLocations, setSavedLocations] = useState<Address[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  useEffect(() => {
    if (open) {
      loadLocations();
    }
  }, [open]);

  const loadLocations = async () => {
    const user = authApi.getCurrentUser();
    if (!user) {
      // 로그인하지 않은 경우 빈 목록 유지 (에러 토스트 제거)
      setSavedLocations([]);
      return;
    }

    try {
      const locations = await addressApi.getMyAddresses();
      setSavedLocations(locations);
    } catch (error) {
      console.error('주소 목록 로드 실패:', error);
      // 인증 에러인 경우 구체적인 메시지
      if (error instanceof Error && error.message.includes('401')) {
        toast.error('로그인이 만료되었습니다. 다시 로그인해주세요.');
      } else {
        toast.error('주소 목록을 불러올 수 없습니다.');
      }
    }
  };

  const handleSelectLocation = async (location: Address) => {
    try {
      // 선택한 주소를 기본 주소로 설정
      await addressApi.setDefaultAddress(location.id);

      setSelectedLocationId(location.id);

      // isDefault를 true로 업데이트하여 전달
      const updatedLocation = { ...location, isDefault: true };
      onLocationChange(updatedLocation);

      toast.success(`${location.locationNm}로 설정되었습니다.`);
      onClose();

      // 주소 목록 새로고침 (다른 주소들의 isDefault가 false로 변경됨)
      await loadLocations();
    } catch (error) {
      console.error('기본 주소 설정 실패:', error);
      toast.error('주소 설정에 실패했습니다.');
    }
  };

  const handleDeleteLocation = async (id: number, event: React.MouseEvent) => {
    event.stopPropagation();

    try {
      await addressApi.deleteAddress(id);
      const newLocations = savedLocations.filter(loc => loc.id !== id);
      setSavedLocations(newLocations);

      // 삭제한 위치가 현재 선택된 위치였다면 선택 해제
      if (selectedLocationId === id) {
        setSelectedLocationId(null);
        onLocationChange(null);
      }

      toast.success('위치가 삭제되었습니다.');
    } catch (error) {
      console.error('주소 삭제 실패:', error);
      toast.error('위치를 삭제할 수 없습니다.');
    }
  };

  const handleAddCurrentLocation = async () => {
    if (savedLocations.length >= 3) {
      toast.error('최대 3개의 위치만 저장할 수 있습니다.');
      return;
    }

    const user = authApi.getCurrentUser();
    if (!user) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    setIsGettingLocation(true);
    try {
      const position = await getCurrentPosition();
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const address = await getAddressFromCoords(lat, lng);

      if (!address || !address.trim()) {
        toast.error('주소를 가져올 수 없습니다.');
        return;
      }

      const newAddress = await addressApi.addAddress({
        locationNm: address,
        latitude: lat,
        longitude: lng,
      });

      setSavedLocations([...savedLocations, newAddress]);
      toast.success('현재 위치가 저장되었습니다.');
    } catch (error) {
      console.error('현재 위치 저장 실패:', error);
      toast.error('위치를 저장할 수 없습니다.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleAddCustomLocation = () => {
    if (savedLocations.length >= 3) {
      toast.error('최대 3개의 위치만 저장할 수 있습니다.');
      return;
    }

    onClose();
    onNavigateToLocationSelect();
  };

  const canAddLocation = savedLocations.length < 3;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            내 동네 설정
          </DialogTitle>
          <DialogDescription>
            최대 3개의 동네를 저장하고 근처 상품을 확인하세요
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {/* 저장된 위치 목록 */}
          {savedLocations.length > 0 ? (
            savedLocations.map((location) => (
              <div
                key={location.id}
                className={`
                  flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${
                    selectedLocationId === location.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }
                `}
                onClick={() => handleSelectLocation(location)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <MapPin
                    className={`h-5 w-5 flex-shrink-0 ${
                      selectedLocationId === location.id
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{location.locationNm}</p>
                    <p className="text-xs text-muted-foreground">
                      저장된 위치
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => handleDeleteLocation(location.id, e)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">저장된 위치가 없습니다</p>
              <p className="text-xs mt-1">아래 버튼으로 위치를 추가해보세요</p>
            </div>
          )}

          {/* 위치 추가 버튼들 */}
          {canAddLocation && (
            <div className="space-y-2 pt-2 border-t">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleAddCurrentLocation}
                disabled={isGettingLocation}
              >
                <Navigation className="mr-2 h-4 w-4" />
                {isGettingLocation ? '현재 위치 가져오는 중...' : '현재 위치 추가'}
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleAddCustomLocation}
              >
                <Plus className="mr-2 h-4 w-4" />
                직접 검색하여 추가
              </Button>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="ghost" onClick={onClose}>
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
