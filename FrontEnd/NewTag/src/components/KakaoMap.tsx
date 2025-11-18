import { useEffect, useRef, useState } from 'react';
import { loadKakaoMap } from '../utils/kakaoMap';

interface KakaoMapProps {
  latitude?: number;
  longitude?: number;
  locationName?: string;
  width?: string;
  height?: string;
  level?: number; // 지도 확대 레벨 (1~14, 작을수록 확대)
  draggable?: boolean; // 지도 드래그 가능 여부
  zoomable?: boolean; // 지도 확대/축소 가능 여부
  onLocationChange?: (lat: number, lng: number, address: string) => void;
  showMarker?: boolean;
  className?: string;
}

export const KakaoMap = ({
  latitude = 37.5665,
  longitude = 126.9780,
  locationName,
  width = '100%',
  height = '300px',
  level = 3,
  draggable = true,
  zoomable = true,
  onLocationChange,
  showMarker = true,
  className = '',
}: KakaoMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [error, setError] = useState<string>('');

  // 지도 초기화
  useEffect(() => {
    const initMap = async () => {
      try {
        await loadKakaoMap();

        if (!mapContainer.current) return;

        const { kakao } = window;

        const options = {
          center: new kakao.maps.LatLng(latitude, longitude),
          level: level,
          draggable: draggable,
        };

        const mapInstance = new kakao.maps.Map(mapContainer.current, options);
        setMap(mapInstance);

        // 확대/축소 컨트롤
        if (zoomable) {
          const zoomControl = new kakao.maps.ZoomControl();
          mapInstance.addControl(
            zoomControl,
            kakao.maps.ControlPosition.RIGHT
          );
        }

        // 마커 추가
        if (showMarker) {
          const markerPosition = new kakao.maps.LatLng(latitude, longitude);
          const markerInstance = new kakao.maps.Marker({
            position: markerPosition,
          });
          markerInstance.setMap(mapInstance);
          setMarker(markerInstance);

          // 인포윈도우 (위치명이 있을 경우)
          if (locationName) {
            const infowindow = new kakao.maps.InfoWindow({
              content: `<div style="padding:5px;font-size:12px;">${locationName}</div>`,
            });
            infowindow.open(mapInstance, markerInstance);
          }
        }

        // 지도 클릭 이벤트 (위치 변경 가능한 경우)
        if (onLocationChange && draggable) {
          kakao.maps.event.addListener(
            mapInstance,
            'click',
            async (mouseEvent: any) => {
              const latlng = mouseEvent.latLng;
              const lat = latlng.getLat();
              const lng = latlng.getLng();

              // 마커 이동
              if (marker) {
                marker.setPosition(latlng);
              }

              // 주소 변환
              const geocoder = new kakao.maps.services.Geocoder();
              geocoder.coord2Address(
                lng,
                lat,
                (result: any[], status: any) => {
                  if (status === kakao.maps.services.Status.OK) {
                    const address = result[0]?.address?.address_name || '';
                    onLocationChange(lat, lng, address);
                  }
                }
              );
            }
          );
        }
      } catch (err) {
        console.error('카카오 맵 로드 실패:', err);
        setError('지도를 불러오는데 실패했습니다.');
      }
    };

    initMap();
  }, []);

  // 위치 업데이트
  useEffect(() => {
    if (!map || !window.kakao) return;

    const { kakao } = window;
    const newPosition = new kakao.maps.LatLng(latitude, longitude);

    // 지도 중심 이동
    map.setCenter(newPosition);

    // 마커 이동
    if (marker && showMarker) {
      marker.setPosition(newPosition);
    }
  }, [latitude, longitude, map, marker, showMarker]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-muted ${className}`}
        style={{ width, height }}
      >
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div
      ref={mapContainer}
      className={className}
      style={{ width, height }}
    />
  );
};
