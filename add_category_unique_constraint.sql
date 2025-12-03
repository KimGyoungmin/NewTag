-- ============================================
-- Category 테이블에 UNIQUE 제약조건만 추가
-- ============================================

USE Insa6_aiservice_p3_5;

-- 방법 1: ALTER TABLE로 UNIQUE 제약조건 추가
ALTER TABLE category
ADD UNIQUE KEY unique_category_name (category_nm);

-- 확인
SHOW INDEX FROM category;

-- ============================================
-- 실행 전 주의사항:
-- - 이미 중복된 category_nm이 있으면 에러 발생
-- - 먼저 fix_duplicate_categories.sql을 실행하여 중복 제거 필요
-- ============================================

-- 만약 에러가 발생한다면 중복 데이터 확인:
-- SELECT category_nm, COUNT(*) as count
-- FROM category
-- GROUP BY category_nm
-- HAVING COUNT(*) > 1;
