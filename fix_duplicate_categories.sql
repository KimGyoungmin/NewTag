-- ============================================
-- 중복 카테고리 제거 및 제약조건 추가 스크립트
-- ============================================

USE Insa6_aiservice_p3_5;

-- 1단계: 중복 카테고리 확인
SELECT category_nm, COUNT(*) as count
FROM category
GROUP BY category_nm
HAVING COUNT(*) > 1;

-- 2단계: 각 카테고리의 최소 ID를 찾아서 유지하고 나머지 삭제
-- 먼저 product 테이블에서 중복 카테고리를 사용하는 레코드를 최소 ID로 업데이트

-- 임시 테이블 생성: 각 카테고리명의 최소 ID 저장
CREATE TEMPORARY TABLE IF NOT EXISTS category_min_ids AS
SELECT MIN(id) as min_id, category_nm
FROM category
GROUP BY category_nm;

-- product 테이블의 category_id를 최소 ID로 업데이트
UPDATE product p
INNER JOIN category c ON p.category_id = c.id
INNER JOIN category_min_ids cmi ON c.category_nm = cmi.category_nm
SET p.category_id = cmi.min_id
WHERE p.category_id != cmi.min_id;

-- 3단계: 중복 카테고리 삭제 (최소 ID를 제외한 나머지)
DELETE c FROM category c
LEFT JOIN category_min_ids cmi ON c.id = cmi.min_id
WHERE cmi.min_id IS NULL;

-- 4단계: category_nm에 UNIQUE 제약조건 추가 (향후 중복 방지)
ALTER TABLE category
ADD UNIQUE KEY unique_category_name (category_nm);

-- 5단계: 정리 확인
SELECT * FROM category ORDER BY id;

-- 6단계: 임시 테이블 삭제
DROP TEMPORARY TABLE IF EXISTS category_min_ids;

-- ============================================
-- 실행 후 기대 결과:
-- - 중복된 카테고리가 제거됨
-- - 각 카테고리명이 하나의 ID만 가짐
-- - product 테이블의 모든 참조가 유효한 카테고리 ID를 가리킴
-- - 향후 같은 이름의 카테고리 삽입 시 에러 발생
-- ============================================
