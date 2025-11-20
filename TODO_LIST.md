# 📋 NewTag 프로젝트 향후 TODO 리스트

**작성일**: 2025-11-19
**마지막 업데이트**: 2025-11-19

---

## 🔴 긴급 (High Priority)



### 2. ✅ 관련 상품 추천 기능 (완료)
- **예상 소요 시간**: 4-6시간
- **중요도**: ★★★★☆
- **위치**: ProductDetailPage, ProductService
- **완료일**: 2025-11-20

**완료된 작업**:
- ✅ 같은 카테고리 상품 추천 (조회수 높은 순)
- ✅ 판매자의 다른 상품 섹션 추가
- ✅ 백엔드 API 구현 (getRelatedProducts, getOtherProductsBySeller)
- ✅ 프론트엔드 UI 구현 (그리드 레이아웃)
- ✅ 로딩 스켈레톤 및 빈 상태 처리


## 🟡 중요 (Medium Priority)

### 4. 클라우드 스토리지 연동 (AWS S3)
- **예상 소요 시간**: 1-2일
- **중요도**: ★★★★☆
- **위치**: 이미지 저장 시스템
- **참고 문서**: `IMAGE_STORAGE_IMPROVEMENT.md:269-295`

**작업 내용**:
- S3FileStorageService 구현
- 기존 LocalFileStorageService와 인터페이스 통일
- CDN 연동 (CloudFront)
- 무제한 확장성 확보

**장점**:
- ✅ 무제한 확장
- ✅ CDN 자동 배포
- ✅ 99.99% 가용성
- ✅ 자동 백업

---

### 5. ✅ 이미지 최적화 & 썸네일 생성 (완료)
- **예상 소요 시간**: 1일
- **중요도**: ★★★★☆
- **위치**: FileStorageService
- **참고 문서**: `IMAGE_STORAGE_IMPROVEMENT.md:296-312`
- **완료일**: 2025-11-20

**완료된 작업**:
- ✅ 썸네일 자동 생성 (300x300)
- ✅ 이미지 최적화 (1600x1600, 85% 품질)
- ⚠️ WebP 변환 (미구현 - 선택적)

---

### 6. ✅ 자동 정리 배치 작업 (완료)
- **예상 소요 시간**: 4-6시간
- **중요도**: ★★★☆☆
- **위치**: ProductService, ProductCleanupScheduler
- **참고 문서**: `IMAGE_STORAGE_IMPROVEMENT.md:314-330`
- **완료일**: 2025-11-20

**완료된 작업**:
- ✅ ProductRepository 쿼리 메서드 추가
- ✅ ProductService.cleanupOldDeletedProducts() 구현
- ✅ ProductCleanupScheduler 스케줄러 생성
- ✅ @EnableScheduling 활성화
- ✅ 매일 새벽 3시 자동 실행
- ✅ 이미지 파일 및 DB 레코드 완전 삭제
- ✅ 상세 로깅 및 모니터링


### 8. ✅ Frontend 라우팅 라이브러리 추가 (완료)
- **예상 소요 시간**: 1일
- **중요도**: ★★★★☆
- **위치**: Frontend 구조, App.tsx
- **참고**: Gemini 분석 결과
- **완료일**: 2025-11-20

**완료된 작업**:
- ✅ react-router-dom 패키지 설치
- ✅ @types/react-router-dom 타입 정의 설치
- ✅ BrowserRouter로 App 래핑
- ✅ Routes와 Route로 라우팅 구조 전환
- ✅ useNavigate, useLocation, useParams 훅 적용
- ✅ URL 파라미터 처리 (RouteWrappers)
- ✅ 인증 가드 구현
- ✅ ScrollToTop 컴포넌트로 스크롤 문제 해결
- ✅ 404 처리 및 리다이렉트

---

## 🟢 개선 (Low Priority)

### 9. DB 마이그레이션 도구 도입
- **예상 소요 시간**: 1-2일
- **중요도**: ★★★☆☆
- **위치**: Backend 인프라

**작업 내용**:
- Flyway 또는 Liquibase 도입
- 기존 DDL.sql을 마이그레이션 스크립트로 변환
- 버전 관리 자동화

---

### 10. ✅ 인증 시스템 통합 (완료)
- **예상 소요 시간**: 2-3일
- **중요도**: ★★★★☆
- **위치**: tokenManager, authApi, client.ts
- **완료일**: 2025-11-20

**완료된 작업**:
- ✅ 현재 시스템 분석 (Firebase는 채팅용, JWT만 인증용)
- ✅ LocalStorage 토큰 지속성 추가 (새로고침 시 로그인 유지)
- ✅ Refresh Token 자동 갱신 로직 개선
- ✅ setAccessToken 메서드 추가 (조용한 갱신)
- ✅ API 요청 401 에러 시 자동 토큰 갱신
- ✅ AUTH_SYSTEM.md 문서 작성

---

### 11. 이미지 메타데이터 관리
- **예상 소요 시간**: 1일
- **중요도**: ★★☆☆☆
- **참고 문서**: `IMAGE_STORAGE_IMPROVEMENT.md:332-346`

**작업 내용**:
- image_metadata 테이블 생성
- 파일 크기, 해상도, 포맷 저장
- 이미지 분석 정보 활용

```sql
CREATE TABLE image_metadata (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    product_image_id BIGINT,
    file_size BIGINT,
    width INT,
    height INT,
    format VARCHAR(10),
    created_at DATETIME,
    FOREIGN KEY (product_image_id) REFERENCES product_image(id)
);
```

---

### 12. 상품 등록 개선
- **예상 소요 시간**: 1-2일
- **중요도**: ★★★☆☆
- **위치**: ProductRegisterPage

**작업 내용**:
- 이미지 드래그 앤 드롭
- 이미지 순서 변경
- 이미지 미리보기 개선
- 진행률 표시

---

### 13. 채팅 기능 개선
- **예상 소요 시간**: 2-3일
- **중요도**: ★★★☆☆
- **위치**: ChatPage

**작업 내용**:
- 이미지 전송 기능
- 읽음/안읽음 표시
- 푸시 알림 연동
- 채팅방 나가기 기능

---

### 14. 검색 기능 고도화
- **예상 소요 시간**: 2-3일
- **중요도**: ★★★★☆
- **위치**: SearchPage, ProductService

**작업 내용**:
- 카테고리 필터
- 가격 범위 필터
- 지역 필터
- 정렬 옵션 (최신순, 가격순, 인기순)
- 검색어 자동완성

---

### 15. 찜 기능 UI/UX 개선
- **예상 소요 시간**: 1-2일
- **중요도**: ★★★☆☆
- **위치**: ProductDetailPage, HomePage

**작업 내용**:
- 찜 목록 페이지
- 찜 알림 (가격 변동, 판매 완료)
- 찜한 상품 공유 기능

---

## 🔵 성능 최적화

### 16. N+1 쿼리 문제 해결
- **예상 소요 시간**: 1-2일
- **중요도**: ★★★★☆
- **위치**: ProductService

**현재 상태**:
- ✅ 찜 개수 조회 최적화 (Map 사용)

**추가 작업**:
- 리뷰 평점 조회 최적화
- 이미지 로딩 최적화
- Lazy Loading 적용

---

### 17. 페이지네이션 개선
- **예상 소요 시간**: 1-2일
- **중요도**: ★★★☆☆
- **위치**: Frontend 전체

**작업 내용**:
- 무한 스크롤 구현
- Virtual Scrolling (긴 목록)
- 페이지네이션 컴포넌트 공통화

---

### 18. 캐싱 전략 구현
- **예상 소요 시간**: 2-3일
- **중요도**: ★★★★☆
- **위치**: Backend + Frontend

**작업 내용**:
- Redis 캐시 도입
- 인기 검색어 캐싱
- 상품 목록 캐싱
- Frontend SWR/React Query 도입

---

## 📊 우선순위 요약표

| 우선순위 | 번호 | 항목 | 예상 시간 | 중요도 |
|---------|-----|------|----------|--------|
| 🔴 긴급 | 2 | 관련 상품 추천 | 4-6시간 | ★★★★☆ |
| 🔴 긴급 | 3 | 이미지 마이그레이션 | 1-2시간 | ★★★★★ |
| 🟡 중요 | 4 | AWS S3 연동 | 1-2일 | ★★★★☆ |
| 🟡 중요 | 5 | 이미지 최적화 | 1일 | ★★★★☆ |
| 🟡 중요 | 6 | 자동 정리 배치 | 4-6시간 | ★★★☆☆ |
| 🟡 중요 | 7 | 하드 삭제 기능 | 3-4시간 | ★★★☆☆ |
| 🟡 중요 | 8 | React Router 도입 | 1일 | ★★★★☆ |
| 🟢 개선 | 9 | DB 마이그레이션 도구 | 1-2일 | ★★★☆☆ |
| 🟢 개선 | 10 | 인증 시스템 통합 | 2-3일 | ★★★★☆ |
| 🟢 개선 | 11 | 이미지 메타데이터 | 1일 | ★★☆☆☆ |
| 🟢 개선 | 12 | 상품 등록 개선 | 1-2일 | ★★★☆☆ |
| 🟢 개선 | 13 | 채팅 기능 개선 | 2-3일 | ★★★☆☆ |
| 🟢 개선 | 14 | 검색 기능 고도화 | 2-3일 | ★★★★☆ |
| 🟢 개선 | 15 | 찜 기능 개선 | 1-2일 | ★★★☆☆ |
| 🔵 성능 | 16 | N+1 쿼리 해결 | 1-2일 | ★★★★☆ |
| 🔵 성능 | 17 | 페이지네이션 개선 | 1-2일 | ★★★☆☆ |
| 🔵 성능 | 18 | 캐싱 전략 | 2-3일 | ★★★★☆ |

---

## 🎯 추천 개발 순서

### Phase 1: 긴급 수정 (1주)
4. ⬜ 이미지 마이그레이션
5. ⬜ 관련 상품 추천

### Phase 2: 핵심 기능 강화 (2-3주)
6. ⬜ AWS S3 연동
7. ⬜ 이미지 최적화
8. ⬜ React Router 도입
9. ⬜ 검색 기능 고도화
10. ⬜ 자동 정리 배치

### Phase 3: UX 개선 (2주)
11. ⬜ 상품 등록 개선
12. ⬜ 채팅 기능 개선
13. ⬜ 찜 기능 개선
14. ⬜ 페이지네이션 개선

### Phase 4: 인프라 & 최적화 (2-3주)
15. ⬜ DB 마이그레이션 도구
16. ⬜ 캐싱 전략
17. ⬜ N+1 쿼리 최적화
18. ⬜ 인증 시스템 통합

---

## 📝 참고 사항

### 완료된 작업 ✅
- SearchLogRepository JPQL 쿼리 수정
- 로그인 상태 변경 시 화면 초기화
- 로그아웃 시 검색 오버레이 자동 닫기
- **2025-11-20 완료**:
  - ✅ 관련 상품 추천 기능 (카테고리 + 판매자)
  - ✅ 자동 정리 배치 작업 (스케줄러)
  - ✅ React Router 도입 (URL 라우팅)
  - ✅ ScrollToTop 구현 (스크롤 문제 해결)
  - ✅ 이미지 최적화 & 썸네일 생성 (기존 구현 확인)
  - ✅ 인증 시스템 통합 (LocalStorage 지속성, 자동 갱신)

### 현재 진행 중 🚧
- 없음

### 블로커 🚫
- 없음

---

## 📚 관련 문서

- [IMAGE_STORAGE_IMPROVEMENT.md](IMAGE_STORAGE_IMPROVEMENT.md) - 이미지 저장 구조 개선
- [INTEGRATION_COMPLETE.md](INTEGRATION_COMPLETE.md) - Frontend 통합 완료 보고서
- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - 프로젝트 구조
- [.ai-workflow/gemini-output/daily-analysis/latest.md](.ai-workflow/gemini-output/daily-analysis/latest.md) - Gemini 분석 결과

---

**작성자**: Claude Code AI Assistant
**최종 업데이트**: 2025-11-20
**다음 리뷰 예정일**: 2025-11-27
