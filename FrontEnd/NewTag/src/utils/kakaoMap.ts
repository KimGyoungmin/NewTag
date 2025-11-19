// 카카오 맵 SDK 유틸리티

declare global {
  interface Window {
    kakao: any;
  }
}

/**
 * 카카오 맵 SDK 로드 대기
 */
export const loadKakaoMap = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(() => resolve());
    } else {
      reject(new Error('카카오 맵 SDK를 로드할 수 없습니다.'));
    }
  });
};

/**
 * 현재 사용자 위치 가져오기
 */
export const getCurrentPosition = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation을 지원하지 않는 브라우저입니다.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('위치 접근 권한이 거부되었습니다.'));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error('위치 정보를 사용할 수 없습니다.'));
            break;
          case error.TIMEOUT:
            reject(new Error('위치 정보 요청 시간이 초과되었습니다.'));
            break;
          default:
            reject(new Error('알 수 없는 오류가 발생했습니다.'));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};

/**
 * 좌표를 주소로 변환 (Geocoder 역변환)
 */
export const getAddressFromCoords = async (
  lat: number,
  lng: number
): Promise<string> => {
  await loadKakaoMap();

  return new Promise((resolve, reject) => {
    const geocoder = new window.kakao.maps.services.Geocoder();

    geocoder.coord2Address(lng, lat, (result: any[], status: any) => {
      if (status === window.kakao.maps.services.Status.OK) {
        if (result[0]) {
          const address = result[0].address;
          const fullAddress = address.address_name;
          // "서울 강남구 역삼동" 형태로 반환
          resolve(fullAddress);
        } else {
          reject(new Error('주소를 찾을 수 없습니다.'));
        }
      } else {
        reject(new Error('주소 변환에 실패했습니다.'));
      }
    });
  });
};

/**
 * 주소를 좌표로 변환 (Geocoder 정변환)
 */
export const getCoordsFromAddress = async (
  address: string
): Promise<{ lat: number; lng: number }> => {
  await loadKakaoMap();

  return new Promise((resolve, reject) => {
    const geocoder = new window.kakao.maps.services.Geocoder();

    geocoder.addressSearch(address, (result: any[], status: any) => {
      if (status === window.kakao.maps.services.Status.OK) {
        if (result[0]) {
          resolve({
            lat: parseFloat(result[0].y),
            lng: parseFloat(result[0].x),
          });
        } else {
          reject(new Error('좌표를 찾을 수 없습니다.'));
        }
      } else {
        reject(new Error('좌표 변환에 실패했습니다.'));
      }
    });
  });
};

/**
 * 두 좌표 간의 거리 계산 (단위: km)
 */
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // 지구 반지름 (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // 소수점 첫째자리까지
};

/**
 * 거리 포맷팅 (km 또는 m)
 */
export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  } else if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)}km`;
  } else {
    return `${Math.round(distanceKm)}km`;
  }
};
