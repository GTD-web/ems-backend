-- ============================================================
-- 직원 테이블에 isAccessible 컬럼 추가 DDL
-- ============================================================
-- 설명: employee 테이블에 isAccessible 컬럼을 추가합니다.
--       이 필드는 2중 보안을 위한 시스템 접근 가능 여부를 나타냅니다.
--       외부 SSO 시스템에서 역할과 접근 권한을 얻었더라도,
--       이 시스템에서 별도로 접근 가능한 상태인지 확인하는 용도입니다.
-- 실행일: 2025-01-XX
-- ============================================================

-- 1. 컬럼 존재 여부 확인 후 추가
-- PostgreSQL에서는 IF NOT EXISTS를 사용하여 안전하게 추가
DO $$
BEGIN
    -- isAccessible 컬럼이 존재하는지 확인하고 추가
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'employee' 
        AND column_name = 'isAccessible'
    ) THEN
        ALTER TABLE employee 
        ADD COLUMN "isAccessible" BOOLEAN NOT NULL DEFAULT false;
        
        -- 컬럼 코멘트 추가
        COMMENT ON COLUMN employee."isAccessible" IS '시스템 접근 가능 여부 (2중 보안용)';
        
        RAISE NOTICE 'isAccessible 컬럼이 성공적으로 추가되었습니다.';
    ELSE
        RAISE NOTICE 'isAccessible 컬럼이 이미 존재합니다. 추가 작업을 건너뜁니다.';
    END IF;
END $$;

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

-- ============================================================
-- 롤백 스크립트 (필요시 사용)
-- ============================================================
-- 만약 롤백이 필요한 경우 아래 스크립트를 실행하세요:
-- 
-- DO $$
-- BEGIN
--     IF EXISTS (
--         SELECT 1 
--         FROM information_schema.columns 
--         WHERE table_schema = 'public' 
--         AND table_name = 'employee' 
--         AND column_name = 'isAccessible'
--     ) THEN
--         ALTER TABLE employee DROP COLUMN "isAccessible";
--         RAISE NOTICE 'isAccessible 컬럼이 성공적으로 삭제되었습니다.';
--     ELSE
--         RAISE NOTICE 'isAccessible 컬럼이 존재하지 않습니다. 삭제 작업을 건너뜁니다.';
--     END IF;
-- END $$;
-- ============================================================

