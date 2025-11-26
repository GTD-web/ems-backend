-- ============================================================
-- 평가기간-직원 맵핑 테이블에 평가기준 제출 관련 컬럼 추가 DDL
-- ============================================================
-- 설명: evaluation_period_employee_mapping 테이블에 평가기준 제출 관련 컬럼을 추가합니다.
--       - isCriteriaSubmitted: 평가기준 제출 여부
--       - criteriaSubmittedAt: 평가기준 제출 일시
--       - criteriaSubmittedBy: 평가기준 제출 처리자 ID
-- ============================================================

-- 1. isCriteriaSubmitted 컬럼 추가
ALTER TABLE evaluation_period_employee_mapping 
ADD COLUMN IF NOT EXISTS "isCriteriaSubmitted" BOOLEAN NOT NULL DEFAULT false;

-- 컬럼 코멘트 추가
COMMENT ON COLUMN evaluation_period_employee_mapping."isCriteriaSubmitted" 
IS '평가기준 제출 여부';

-- 2. criteriaSubmittedAt 컬럼 추가
ALTER TABLE evaluation_period_employee_mapping 
ADD COLUMN IF NOT EXISTS "criteriaSubmittedAt" TIMESTAMP WITH TIME ZONE;

-- 컬럼 코멘트 추가
COMMENT ON COLUMN evaluation_period_employee_mapping."criteriaSubmittedAt" 
IS '평가기준 제출 일시';

-- 3. criteriaSubmittedBy 컬럼 추가
ALTER TABLE evaluation_period_employee_mapping 
ADD COLUMN IF NOT EXISTS "criteriaSubmittedBy" VARCHAR(100);

-- 컬럼 코멘트 추가
COMMENT ON COLUMN evaluation_period_employee_mapping."criteriaSubmittedBy" 
IS '평가기준 제출 처리자 ID';

-- ============================================================
-- 실행 확인 쿼리
-- ============================================================
-- 추가 후 확인:
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'evaluation_period_employee_mapping' 
AND column_name IN ('isCriteriaSubmitted', 'criteriaSubmittedAt', 'criteriaSubmittedBy')
ORDER BY column_name;

-- 예상 결과:
-- column_name            | data_type                   | column_default | is_nullable
-- -----------------------|-----------------------------|----------------|------------
-- criteriaSubmittedAt    | timestamp with time zone    | NULL           | YES
-- criteriaSubmittedBy    | character varying           | NULL           | YES
-- isCriteriaSubmitted    | boolean                     | false          | NO
-- ============================================================

