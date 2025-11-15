-- ============================================================
-- 직원 테이블에 isAccessible 컬럼 추가 DDL (간단 버전)
-- ============================================================
-- 설명: employee 테이블에 isAccessible 컬럼을 추가합니다.
--       이 필드는 2중 보안을 위한 시스템 접근 가능 여부를 나타냅니다.
--       외부 SSO 시스템에서 역할과 접근 권한을 얻었더라도,
--       이 시스템에서 별도로 접근 가능한 상태인지 확인하는 용도입니다.
-- 
-- 주의: 이 스크립트는 컬럼이 이미 존재하면 에러가 발생할 수 있습니다.
--       안전한 버전은 add-is-accessible-to-employee.sql을 사용하세요.
-- ============================================================

-- isAccessible 컬럼 추가
ALTER TABLE employee 
ADD COLUMN IF NOT EXISTS "isAccessible" BOOLEAN NOT NULL DEFAULT false;

-- 컬럼 코멘트 추가
COMMENT ON COLUMN employee."isAccessible" IS '시스템 접근 가능 여부 (2중 보안용)';

-- ============================================================
-- 실행 확인 쿼리
-- ============================================================
-- 추가 후 확인:
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
-- AND table_name = 'employee' 
-- AND column_name = 'isAccessible';
-- 
-- 예상 결과:
-- column_name  | data_type | column_default | is_nullable
-- -------------|-----------|----------------|------------
-- isAccessible | boolean   | false          | NO
-- ============================================================

