/**
 * 사용자 위치 관리 유틸리티
 * 최대 2개의 위치를 저장하고 관리합니다.
 */

export interface SavedLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  createdAt: string;
}

const STORAGE_KEY = 'user_saved_locations';
const MAX_LOCATIONS = 2;

/**
 * 저장된 위치 목록 조회
 */
export const getSavedLocations = (): SavedLocation[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to get saved locations:', error);
    return [];
  }
};

/**
 * 위치 저장
 */
export const saveLocation = (location: Omit<SavedLocation, 'id' | 'createdAt'>): SavedLocation[] => {
  try {
    const locations = getSavedLocations();

    // 이미 같은 이름의 위치가 있는지 확인
    const existingIndex = locations.findIndex(loc => loc.name === location.name);

    if (existingIndex !== -1) {
      // 기존 위치 업데이트
      locations[existingIndex] = {
        ...location,
        id: locations[existingIndex].id,
        createdAt: locations[existingIndex].createdAt,
      };
    } else {
      // 새 위치 추가
      const newLocation: SavedLocation = {
        ...location,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };

      // 최대 2개까지만 저장 (가장 오래된 것 삭제)
      if (locations.length >= MAX_LOCATIONS) {
        locations.shift(); // 첫 번째 요소 제거
      }

      locations.push(newLocation);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
    return locations;
  } catch (error) {
    console.error('Failed to save location:', error);
    return getSavedLocations();
  }
};

/**
 * 위치 삭제
 */
export const deleteLocation = (id: string): SavedLocation[] => {
  try {
    const locations = getSavedLocations();
    const filtered = locations.filter(loc => loc.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return filtered;
  } catch (error) {
    console.error('Failed to delete location:', error);
    return getSavedLocations();
  }
};

/**
 * 현재 선택된 위치 조회
 */
export const getSelectedLocation = (): SavedLocation | null => {
  try {
    const stored = localStorage.getItem('selected_location');
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to get selected location:', error);
    return null;
  }
};

/**
 * 위치 선택
 */
export const setSelectedLocation = (location: SavedLocation | null): void => {
  try {
    if (location) {
      localStorage.setItem('selected_location', JSON.stringify(location));
    } else {
      localStorage.removeItem('selected_location');
    }
  } catch (error) {
    console.error('Failed to set selected location:', error);
  }
};

/**
 * 모든 위치 삭제
 */
export const clearAllLocations = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('selected_location');
  } catch (error) {
    console.error('Failed to clear locations:', error);
  }
};
