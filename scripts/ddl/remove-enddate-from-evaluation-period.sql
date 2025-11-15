-- ============================================================
-- 평가 기간 테이블에서 endDate 컬럼 삭제 DDL
-- ============================================================
-- 설명: evaluation_period 테이블에서 endDate 컬럼을 삭제합니다.
--       엔티티에서 endDate 필드가 제거되었으므로 데이터베이스 스키마도 동기화합니다.
-- 실행일: 2025-11-13
-- ============================================================

-- 1. 컬럼 존재 여부 확인 후 삭제
-- PostgreSQL에서는 IF EXISTS를 사용하여 안전하게 삭제
DO $$
BEGIN
    -- endDate 컬럼이 존재하는지 확인하고 삭제
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'evaluation_period' 
        AND column_name = 'endDate'
    ) THEN
        ALTER TABLE evaluation_period DROP COLUMN "endDate";
        RAISE NOTICE 'endDate 컬럼이 성공적으로 삭제되었습니다.';
    ELSE
        RAISE NOTICE 'endDate 컬럼이 존재하지 않습니다. 삭제 작업을 건너뜁니다.';
    END IF;
END $$;

-- ============================================================
-- 롤백 스크립트 (필요시 사용)
-- ============================================================
-- 만약 롤백이 필요한 경우 아래 스크립트를 실행하세요:
-- 
-- ALTER TABLE evaluation_period 
-- ADD COLUMN "endDate" TIMESTAMP NULL;
-- 
-- COMMENT ON COLUMN evaluation_period."endDate" IS '평가 기간 종료일';
-- ============================================================

