# 카카오 맵 API 구현 가이드

## 📋 개요

NewTag 프로젝트에 카카오 맵 API를 통합하여 위치 기반 거래 기능을 구현했습니다.

**구현 날짜**: 2025-11-18
**카카오 맵 JavaScript API 키**: `b149e3b651751906ddfd9c90f205bfe5`

---

## ✅ 구현된 기능

### 1. 카카오 맵 SDK 설정
- ✅ HTML에 카카오 맵 SDK 스크립트 추가
- ✅ 환경 변수에 API 키 설정 (`.env`)
- ✅ 카카오 맵 SDK 라이브러리 로드 (services, clusterer, drawing)

### 2. 위치 유틸리티 함수
- ✅ 카카오 맵 SDK 로드 대기 (`loadKakaoMap`)
- ✅ 현재 사용자 위치 가져오기 (`getCurrentPosition`)
- ✅ 좌표 → 주소 변환 (`getAddressFromCoords`)
- ✅ 주소 → 좌표 변환 (`getCoordsFromAddress`)
- ✅ 두 좌표 간 거리 계산 (`calculateDistance`)
- ✅ 거리 포맷팅 (`formatDistance`)

### 3. 카카오 맵 컴포넌트
- ✅ 재사용 가능한 `KakaoMap` 컴포넌트
- ✅ 지도 확대/축소 컨트롤
- ✅ 마커 표시
- ✅ 인포윈도우 (위치명 표시)
- ✅ 지도 클릭 이벤트 (위치 변경)
- ✅ 드래그 가능 여부 설정

### 4. 위치 선택 다이얼로그
- ✅ `LocationPicker` 컴포넌트
- ✅ 현재 위치 자동 감지 버튼
- ✅ 지도 클릭으로 위치 선택
- ✅ 선택된 위치 정보 표시 (주소, 좌표)
- ✅ 선택 완료 / 취소 버튼

### 5. 상품 등록 시 위치 설정
- ✅ ProductRegisterPage에 위치 선택 기능 통합
- ✅ 위치 변경 버튼
- ✅ 위도/경도 저장

### 6. 상품 상세 페이지 지도 표시
- ✅ ProductDetailPage에 거래 위치 지도 추가
- ✅ 읽기 전용 지도 (드래그 불가)
- ✅ 마커 및 위치명 표시

### 7. 위치 기반 상품 검색
- ✅ ProductCard에 거리 표시 기능 추가
- ✅ 거리 아이콘과 포맷팅된 거리 표시

---

## 📁 파일 구조

```
FrontEnd/NewTag/
├── index.html                              # 카카오 맵 SDK 스크립트 추가
├── .env                                    # 카카오 맵 API 키 설정
├── src/
│   ├── utils/
│   │   └── kakaoMap.ts                     # 카카오 맵 유틸리티 함수
│   ├── components/
│   │   ├── KakaoMap.tsx                    # 카카오 맵 컴포넌트
│   │   ├── LocationPicker.tsx              # 위치 선택 다이얼로그
│   │   └── ProductCard.tsx                 # 거리 표시 추가
│   └── pages/
│       ├── ProductRegisterPage.tsx         # 위치 선택 기능 통합
│       └── ProductDetailPage.tsx           # 지도 표시 추가

BackEnd/
└── src/main/java/com/goldenRun/NewTag/
    ├── entity/
    │   └── Product.java                    # 위치 필드 (이미 구현됨)
    ├── dto/
    │   └── ProductDtos.java                # 위치 DTO (이미 구현됨)
    └── service/
        └── ProductService.java             # 위치 정보 매핑 (이미 구현됨)
```

---

## 🔧 기술 스택

### Frontend
- **카카오 맵 JavaScript SDK**: v2
- **React**: 18.3.1
- **TypeScript**: 5.7.3
- **Geolocation API**: 브라우저 내장

### Backend
- **Spring Boot**: JPA Entity
- **Database**: MySQL (latitude, longitude, location_nm 컬럼)

---

## 🚀 사용 방법

### 1. 환경 설정

**`.env` 파일에 카카오 맵 API 키 추가**
```env
VITE_KAKAO_MAP_APP_KEY=b149e3b651751906ddfd9c90f205bfe5
```

**`index.html`에 SDK 스크립트 추가**
```html
<script type="text/javascript"
  src="//dapi.kakao.com/v2/maps/sdk.js?appkey=b149e3b651751906ddfd9c90f205bfe5&libraries=services,clusterer,drawing&autoload=false">
</script>
```

### 2. 상품 등록 시 위치 선택

```tsx
import { LocationPicker } from '../components/LocationPicker';

const [showLocationPicker, setShowLocationPicker] = useState(false);
const [latitude, setLatitude] = useState(37.5665);
const [longitude, setLongitude] = useState(126.9780);
const [location, setLocation] = useState('서울특별시 중구 명동');

const handleLocationSelect = (locationData) => {
  setLatitude(locationData.latitude);
  setLongitude(locationData.longitude);
  setLocation(locationData.locationName);
};

<LocationPicker
  open={showLocationPicker}
  onClose={() => setShowLocationPicker(false)}
  onSelect={handleLocationSelect}
  initialLatitude={latitude}
  initialLongitude={longitude}
  initialLocationName={location}
/>
```

### 3. 상품 상세 페이지에서 지도 표시

```tsx
import { KakaoMap } from '../components/KakaoMap';

{product.latitude && product.longitude && (
  <KakaoMap
    latitude={product.latitude}
    longitude={product.longitude}
    locationName={product.locationNm}
    height="300px"
    level={3}
    draggable={false}
    zoomable={true}
    showMarker={true}
  />
)}
```

### 4. 거리 계산 및 표시

```tsx
import { calculateDistance, formatDistance } from '../utils/kakaoMap';

// 사용자 위치와 상품 위치 간의 거리 계산
const userLat = 37.5665;
const userLng = 126.9780;
const productLat = product.latitude;
const productLng = product.longitude;

const distance = calculateDistance(userLat, userLng, productLat, productLng);
const formattedDistance = formatDistance(distance); // "1.2km" 또는 "500m"

<ProductCard
  {...product}
  distance={distance}
/>
```

---

## 📊 데이터베이스 스키마

### Product 테이블

| 컬럼명 | 타입 | 제약 | 설명 |
|--------|------|------|------|
| `location_nm` | VARCHAR(100) | NULL 가능 | 거래 위치명 (예: "강남구 역삼동") |
| `latitude` | DECIMAL(10, 7) | NULL 가능 | 위도 (예: 37.5665) |
| `longitude` | DECIMAL(10, 7) | NULL 가능 | 경도 (예: 126.9780) |

**인덱스**: `idx_product_location` (latitude, longitude)

---

## 🎯 주요 API

### 카카오 맵 유틸리티 함수

#### `loadKakaoMap(): Promise<void>`
카카오 맵 SDK를 로드합니다.

```typescript
await loadKakaoMap();
// 카카오 맵 SDK 사용 가능
```

#### `getCurrentPosition(): Promise<GeolocationPosition>`
현재 사용자 위치를 가져옵니다.

```typescript
try {
  const position = await getCurrentPosition();
  console.log(position.coords.latitude);
  console.log(position.coords.longitude);
} catch (error) {
  console.error('위치 접근 권한이 거부되었습니다.');
}
```

#### `getAddressFromCoords(lat: number, lng: number): Promise<string>`
좌표를 주소로 변환합니다 (역지오코딩).

```typescript
const address = await getAddressFromCoords(37.5665, 126.9780);
// 결과: "서울특별시 중구 명동"
```

#### `getCoordsFromAddress(address: string): Promise<{lat: number, lng: number}>`
주소를 좌표로 변환합니다 (지오코딩).

```typescript
const coords = await getCoordsFromAddress('서울특별시 중구 명동');
// 결과: { lat: 37.5665, lng: 126.9780 }
```

#### `calculateDistance(lat1, lng1, lat2, lng2): number`
두 좌표 간의 거리를 계산합니다 (단위: km).

```typescript
const distance = calculateDistance(37.5665, 126.9780, 37.5012, 127.0396);
// 결과: 5.2 (km)
```

#### `formatDistance(distanceKm: number): string`
거리를 사용자 친화적인 문자열로 포맷팅합니다.

```typescript
formatDistance(0.5);   // "500m"
formatDistance(1.2);   // "1.2km"
formatDistance(15.8);  // "16km"
```

---

## 🧩 컴포넌트 Props

### KakaoMap

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `latitude` | number | 37.5665 | 위도 |
| `longitude` | number | 126.9780 | 경도 |
| `locationName` | string | - | 위치명 (인포윈도우) |
| `width` | string | "100%" | 지도 너비 |
| `height` | string | "300px" | 지도 높이 |
| `level` | number | 3 | 지도 확대 레벨 (1~14) |
| `draggable` | boolean | true | 드래그 가능 여부 |
| `zoomable` | boolean | true | 확대/축소 가능 여부 |
| `showMarker` | boolean | true | 마커 표시 여부 |
| `onLocationChange` | function | - | 위치 변경 콜백 |
| `className` | string | "" | 추가 CSS 클래스 |

### LocationPicker

| Prop | 타입 | 설명 |
|------|------|------|
| `open` | boolean | 다이얼로그 표시 여부 |
| `onClose` | function | 닫기 콜백 |
| `onSelect` | function | 위치 선택 콜백 |
| `initialLatitude` | number | 초기 위도 |
| `initialLongitude` | number | 초기 경도 |
| `initialLocationName` | string | 초기 위치명 |

**`onSelect` 콜백 파라미터**:
```typescript
{
  latitude: number;      // 위도
  longitude: number;     // 경도
  locationName: string;  // 주소
}
```

---

## ⚠️ 주의사항

### 1. 위치 권한
- 브라우저에서 위치 접근 권한을 요청합니다
- 사용자가 권한을 거부하면 현재 위치 기능을 사용할 수 없습니다
- HTTPS 환경에서만 Geolocation API가 정상 작동합니다

### 2. 카카오 맵 API 제한
- 일일 호출 제한: 300,000회 (무료 플랜)
- 초과 시 API 키를 업그레이드해야 합니다
- API 키는 공개 저장소에 노출되지 않도록 주의하세요

### 3. 성능 최적화
- 지도는 필요할 때만 렌더링됩니다 (조건부 렌더링)
- 카카오 맵 SDK는 `autoload=false`로 설정하여 수동 로드합니다
- 컴포넌트 언마운트 시 이벤트 리스너를 정리해야 합니다

### 4. 크로스 브라우저 호환성
- Geolocation API는 대부분의 최신 브라우저에서 지원됩니다
- IE11 이하에서는 polyfill이 필요할 수 있습니다

---

## 🐛 트러블슈팅

### 문제 1: "카카오 맵 SDK를 로드할 수 없습니다"
**원인**: SDK 스크립트가 로드되지 않았거나 API 키가 잘못됨
**해결**:
- `index.html`에 스크립트 태그가 있는지 확인
- 네트워크 탭에서 SDK 로드 확인
- API 키가 올바른지 확인

### 문제 2: "위치 접근 권한이 거부되었습니다"
**원인**: 브라우저에서 위치 권한을 거부함
**해결**:
- 브라우저 설정에서 위치 권한을 허용
- HTTPS 환경에서 실행 (HTTP에서는 Geolocation 제한됨)

### 문제 3: 지도가 표시되지 않음
**원인**: 컨테이너 높이가 0px일 수 있음
**해결**:
- 명시적으로 `height` prop 설정
- 부모 요소에 높이 설정

### 문제 4: 좌표 변환 실패
**원인**: 잘못된 주소 형식 또는 카카오 맵 데이터베이스에 없는 주소
**해결**:
- 정확한 주소 형식 사용 (예: "서울특별시 중구 명동")
- 도로명 주소 또는 지번 주소 사용

---

## 📈 향후 개선 사항

### 1. 위치 기반 필터링
- [ ] 거리 범위 설정 (1km, 3km, 5km, 10km)
- [ ] 지도에서 영역 선택으로 상품 검색
- [ ] 사용자 위치 기준 자동 정렬

### 2. 지도 클러스터링
- [ ] 여러 상품을 지도에 표시할 때 클러스터링 적용
- [ ] 클러스터 클릭 시 확대

### 3. 경로 안내
- [ ] 현재 위치에서 거래 장소까지 길찾기
- [ ] 예상 소요 시간 표시

### 4. 즐겨찾는 위치
- [ ] 자주 사용하는 위치 저장 (집, 회사 등)
- [ ] 빠른 위치 선택

### 5. 주변 지역 정보
- [ ] 거래 장소 근처 지하철역, 버스정류장 표시
- [ ] 안전 지수 표시 (경찰서, CCTV 등)

---

## 📚 참고 자료

- [카카오 맵 API 공식 문서](https://apis.map.kakao.com/web/)
- [카카오 맵 JavaScript API 가이드](https://apis.map.kakao.com/web/guide/)
- [Geolocation API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
- [Haversine 공식 (거리 계산)](https://en.wikipedia.org/wiki/Haversine_formula)

---

## 📝 변경 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 2025-11-18 | 1.0.0 | 초기 카카오 맵 API 구현 | Claude |

---

**문서 작성**: 2025-11-18
**마지막 업데이트**: 2025-11-18
