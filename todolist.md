# NewTag 프로젝트 TODO 리스트

## 📋 코드 리뷰 요약 (2025-11-24)

### 전체 평가
- **승인 여부**: 조건부 승인
- **종합 점수**: 7/10
- **주요 이슈**: 20개 (HIGH: 4개, MEDIUM: 10개, LOW: 6개)

---

## 🔴 HIGH Priority (긴급)

### 1. User.java @Data 사용 지양
- **파일**: `BackEnd/src/main/java/com/goldenRun/NewTag/entity/User.java:46`
- **문제**: `@Data`는 `equals()`, `hashCode()` 자동 생성으로 Entity에서 순환 참조 위험
- **해결**: `@Getter @Setter`로 변경
- **심각도**: HIGH

### 2. Product.java 네이밍 컨벤션 불일치
- **파일**: `BackEnd/src/main/java/com/goldenRun/NewTag/entity/Product.java:38,42,43`
- **문제**: `location_nm`, `view_count`, `is_delete`는 snake_case (DB 컬럼명과 Java 필드명 혼용)
- **해결**: `@Column(name="...")` 추가하고 필드명은 camelCase 사용
- **심각도**: HIGH

### 3. User Cascade DELETE 위험성
- **파일**: `BackEnd/src/main/java/com/goldenRun/NewTag/entity/User.java:126-152`
- **문제**: User 삭제 시 모든 Transaction까지 삭제됨 (거래 이력 손실 위험)
- **해결**: buyTransactions/sellTransactions는 cascade 제거하고 soft delete 고려
- **심각도**: HIGH

### 4. 인증 엔드포인트 Rate Limiting 부재
- **파일**: 보안 설정 전체
- **문제**: 무차별 대입 공격(brute force) 취약
- **해결**: Spring Security Rate Limiter 또는 Bucket4j 적용
- **심각도**: HIGH

---

## 🟡 MEDIUM Priority (중요)

### 5. LocationSelectPage 디버그 로그 제거
- **파일**: `FrontEnd/NewTag/src/pages/LocationSelectPage.tsx:95-130`
- **문제**: 프로덕션에 console.log 10개 남아있음
- **해결**: 모두 제거 또는 환경변수 기반 로깅으로 변경
- **심각도**: MEDIUM

### 6. 전체 FrontEnd console.log 제거
- **파일**: FrontEnd 전체 (8개 파일, 30개 발견)
- **문제**: 개발용 로그가 프로덕션에 노출
- **해결**: 모두 제거하고 필요시 로깅 라이브러리 사용
- **심각도**: MEDIUM

### 7. KakaoAuthService 테스트 코드 부재
- **파일**: `BackEnd/src/main/java/com/goldenRun/NewTag/service/KakaoAuthService.java`
- **문제**: createNewKakaoUser 로직 검증 불가
- **해결**: Unit 테스트 추가
- **심각도**: MEDIUM

### 8. Category API 캐싱 미적용
- **파일**: `BackEnd/src/main/java/com/goldenRun/NewTag/controller/CategoryController.java`
- **문제**: 카테고리는 자주 변경되지 않는데 매번 DB 조회
- **해결**: `@Cacheable` 추가 또는 Redis 캐싱
- **심각도**: MEDIUM

### 9. Product Repository N+1 쿼리 가능성
- **파일**: Product Repository 전체
- **문제**: Product 조회 시 Category, User fetch 전략 미확인
- **해결**: `@EntityGraph` 또는 fetch join 사용
- **심각도**: MEDIUM

### 10. React Error Boundary 부재
- **파일**: FrontEnd 전체
- **문제**: 런타임 에러 시 전체 앱 크래시
- **해결**: React Error Boundary 컴포넌트 추가
- **심각도**: MEDIUM

### 11. CORS 설정 검토 필요
- **파일**: SecurityConfig
- **문제**: 프로덕션 환경 CORS 설정 미확인
- **해결**: SecurityConfig에서 allowedOrigins 환경변수화
- **심각도**: MEDIUM

### 12. 비밀번호 강도 검증 부재
- **파일**: 회원가입 로직
- **문제**: 약한 비밀번호 허용 가능
- **해결**: 회원가입 시 비밀번호 정책 추가 (최소 8자, 특수문자 포함 등)
- **심각도**: MEDIUM

### 13. Product price 검증 부재
- **파일**: `BackEnd/src/main/java/com/goldenRun/NewTag/entity/Product.java`
- **문제**: 음수 가격이나 비정상적으로 큰 가격 허용
- **해결**: `@Min(0)`, `@Max(999999999)` 또는 커스텀 validation 추가
- **심각도**: MEDIUM

### 14. TypeScript strict mode 미사용
- **파일**: `FrontEnd/NewTag/tsconfig.json`
- **문제**: 타입 안전성 보장 부족
- **해결**: tsconfig.json에 `"strict": true` 추가
- **심각도**: MEDIUM

---

## 🟢 LOW Priority (개선)

### 15. API 문서 부재
- **해결**: Swagger/OpenAPI 추가 (SpringDoc 사용)
- **심각도**: LOW

### 16. 로깅 설정 최적화
- **해결**: logback.xml에서 dev/prod 환경 분리
- **심각도**: LOW

### 17. Health Check Endpoint 부재
- **해결**: Spring Actuator 추가
- **심각도**: LOW

### 18. DB 인덱스 최적화
- **해결**: 쿼리 분석 후 복합 인덱스 추가
- **심각도**: LOW

### 19. 환경변수 보안 강화
- **해결**: Vault 또는 AWS Secrets Manager 고려
- **심각도**: LOW

### 20. 통합 테스트 부족
- **해결**: Controller 통합 테스트 추가
- **심각도**: LOW

---

## 💬 팀 논의 필요 사항

1. **Cascade 전략** - Transaction 삭제 정책 (Hard delete vs Soft delete)
2. **캐싱 전략** - Redis vs In-memory cache 선택
3. **로깅 레벨** - 프로덕션 환경 로그 레벨 합의
4. **테스트 커버리지 목표** - 얼마나 높게 설정할지
5. **배포 전략** - Blue/Green vs Rolling Update

---

## 🎯 실행 계획

### 즉시 처리 (금주 내)
- [ ] LocationSelectPage.tsx 디버그 console.log 제거
- [ ] User.java @Data → @Getter @Setter 변경
- [ ] Product.java 네이밍 컨벤션 수정 (camelCase + @Column)
- [ ] 전체 FrontEnd console.log 제거

### 단기 (이번 주)
- [ ] User cascade 전략 재검토 및 수정
- [ ] KakaoAuthService 기본 테스트 코드 추가
- [ ] Category API 캐싱 구현
- [ ] Product price validation 추가

### 중기 (다음 Sprint)
- [ ] Rate Limiting 구현
- [ ] N+1 쿼리 최적화
- [ ] Error Boundary 추가
- [ ] CORS 설정 환경변수화
- [ ] 비밀번호 강도 검증 추가

### 장기 (향후)
- [ ] Swagger API 문서화
- [ ] 통합 테스트 확대
- [ ] 모니터링 시스템 구축 (Prometheus, Grafana)
- [ ] CI/CD 파이프라인 구축
- [ ] 로깅 시스템 구축 (ELK Stack)

---

## ✅ 완료된 작업

- [x] AI 자동 작성 기능 제거 및 통합
- [x] 5개 신규 카테고리 추가 (뷰티/미용, 생활/주방, 유아동/출산, 반려동물 용품, 기타)
- [x] 카테고리 동적 관리 (API 기반)
- [x] 위치 검색 개선 (주소 + POI 검색)
- [x] 카카오 로그인 trust 값 수정 (50 → 0)
- [x] Entity Cascade 관계 추가

---

## 📊 진행률

- **HIGH Priority**: 0/4 (0%)
- **MEDIUM Priority**: 0/10 (0%)
- **LOW Priority**: 0/6 (0%)
- **전체 진행률**: 0/20 (0%)

---

## 🔄 최종 업데이트
2025-11-24
