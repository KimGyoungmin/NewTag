-- ============================================
-- ALTER: review.rating 컬럼 타입 변경
-- DECIMAL(2,1) -> INT (1-5점 시스템)
-- ============================================

USE Insa6_aiservice_p3_5;

-- 기존 CHECK 제약조건 삭제
ALTER TABLE review DROP CONSTRAINT IF EXISTS check_rating_range;
ALTER TABLE review DROP CONSTRAINT IF EXISTS check_rating_step;

-- rating 컬럼 타입 변경: DECIMAL(2,1) -> INT
ALTER TABLE review
  MODIFY COLUMN rating INT NOT NULL COMMENT '평점 (1 ~ 5)';

-- 새로운 CHECK 제약조건 추가 (1-5 범위)
ALTER TABLE review
  ADD CONSTRAINT check_rating_range CHECK (rating >= 1 AND rating <= 5);

-- 확인
DESCRIBE review;
