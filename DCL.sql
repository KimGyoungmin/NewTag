-- ============================================
-- DCL: 권한 관리
-- ============================================

-- developer 계정에 newtag DB의 모든 CRUD 권한 부여
GRANT SELECT, INSERT, UPDATE, DELETE 
ON newtag.* 
TO 'developer'@'%';

-- 추가 권한 (필요 시)
-- GRANT CREATE, DROP, ALTER ON newtag.* TO 'developer'@'%';

-- 권한 적용
FLUSH PRIVILEGES;

-- 권한 확인
SHOW GRANTS FOR 'developer'@'%';