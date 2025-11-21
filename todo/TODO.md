# 🚀 NewTag 프로젝트 TODO 리스트

코드 리뷰를 통해 도출된 개선 사항 및 향후 진행할 작업을 정리한 TODO 리스트입니다. 우선순위(🔺높음, 🔸중간, 🔹낮음)에 따라 작업을 진행하는 것을 권장합니다.

---

## Backend

백엔드는 현재 매우 훌륭한 상태이며, 아래 개선 작업들은 코드의 안정성과 유지보수성을 한 단계 더 높이는 데 중점을 둡니다.

### 🔺 높은 우선순위

- **[ ] 전역 예외 처리기(`@RestControllerAdvice`) 도입**: `ProductNotFoundException`, `AccessDeniedException` 등 서비스 계층의 특정 예외에 대해 일관된 JSON 에러 메시지와 HTTP 상태 코드를 반환하도록 구현합니다. 이는 API 안정성과 프론트엔드 개발 경험을 크게 향상시킵니다.
- **[ ] Enum을 활용한 데이터 모델링 개선**: `Product` 엔티티의 `status` 필드와 같이 `Integer`로 관리되는 상태 값들을 Type-safe한 `Enum`으로 리팩토링합니다. (예: `ProductStatus.ON_SELL`)

### 🔸 중간 우선순위

- **[ ] 공통 API 응답 래퍼(`ApiResponse<T>`) 도입**: 모든 API 응답을 일관된 형식(성공/실패 여부, 데이터, 메시지 등)으로 표준화하여 프론트엔드에서의 처리를 용이하게 합니다.
- **[ ] 커스텀 예외(Custom Exception) 클래스 생성**: `IllegalArgumentException` 대신 `ProductNotFoundException`처럼 의미가 명확한 커스텀 예외를 만들어 사용합니다.

### 🔹 낮은 우선순위

- **[ ] API 경로 상수화**: `SecurityConfig` 등에 하드코딩된 URL 경로 문자열들을 별도의 `final` 상수 클래스로 분리하여 관리합니다.
- **[ ] `convertToListItem` 중복 메소드 제거**: `ProductService`에 존재하는 N+1을 유발할 수 있는 레거시 `convertToListItem` 메소드를 제거하여 최적화된 버전만 남깁니다.

---

## Frontend

프론트엔드는 최신 기술 스택으로 훌륭하게 구현되어 있으나, 일부 컴포넌트가 비대해져 유지보수성 저하가 우려됩니다. 컴포넌트 분리와 로직 추상화에 집중적인 리팩토링이 필요합니다.

### 🔺 높은 우선순위

- **[ ] 거대 컴포넌트(God Component) 리팩토링**:
  - **`HomePage.tsx`**: 데이터 페칭, 무한 스크롤, 상태 관리 로직을 `useProducts`와 같은 커스텀 훅으로 분리하고, UI 컴포넌트를 더 작은 단위로 분할합니다.
  - **`ProductDetailPage.tsx`**: 페이지의 각 섹션(판매자 정보, 상품 정보, 리뷰 등)을 별도의 컴포넌트로 분리하고, 데이터 페칭 및 상태 관리 로직을 `useProductDetail`, `useReviews` 등의 커스텀 훅으로 추상화합니다.

### 🔸 중간 우선순위

- **[ ] 유틸리티 함수 중앙 관리**: `HomePage`와 `ProductDetailPage`에 중복으로 존재하는 `getTimeAgo`와 같은 함수를 `src/utils` 디렉토리로 옮겨 재사용합니다.
- **[ ] 네비게이션 로직 개선**: `onNavigate` prop을 페이지마다 전달하는 대신, 각 컴포넌트에서 React Router의 `useNavigate` 훅을 직접 사용하도록 리팩토링하여 컴포넌트의 독립성을 높입니다.

### 🔹 낮은 우선순위

- **[ ] `RouteWrappers.tsx` 추상화**: 반복되는 Wrapper 컴포넌트들을 HOC(Higher-Order Component) 패턴을 적용하여 하나의 함수로 추상화하고 코드 중복을 제거합니다.
- **[ ] 하드코딩된 값 상수화**: API 파라미터, UI 경로 등 코드에 하드코딩된 문자열과 숫자들을 `src/constants` 파일로 분리하여 관리합니다.

---

## AI Model Service (`img_model`)

AI 모델 서비스는 외부 API를 영리하게 활용하는 실용적인 마이크로서비스입니다. 아래 개선 사항은 서비스의 안정성과 관리 용이성을 높이는 데 도움이 됩니다.

### 🔸 중간 우선순위

- **[ ] API 보안 강화**: 현재 API는 클라이언트로부터 '파일 경로'를 직접 받습니다. 이를 '파일 자체'를 `multipart/form-data`로 직접 업로드받는 방식으로 변경하여 Path Traversal과 같은 잠재적 보안 위협을 원천적으로 차단하는 것을 권장합니다.

### 🔹 낮은 우선순위

- **[ ] 프롬프트 외부 파일로 분리**: `process_images.py` 내부에 하드코딩된 Gemini API 프롬프트를 별도의 `.txt` 또는 `.json` 파일로 분리하여, 코드 수정 없이 프롬프트만 쉽게 수정하고 관리할 수 있도록 개선합니다.
- **[ ] Gemini 응답 스키마 검증**: Gemini로부터 받은 JSON 응답을 파싱한 후, Pydantic 모델 등을 사용하여 기대하는 필드(`title`, `priceKRW` 등)가 모두 존재하는지 스키마를 검증하는 단계를 추가하여 안정성을 높입니다.
