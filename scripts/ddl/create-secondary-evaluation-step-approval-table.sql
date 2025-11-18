-- ============================================================
-- 2차 평가자별 부분 승인 테이블 생성 및 데이터 마이그레이션 DDL
-- ============================================================
-- 설명: 2차 평가자별 개별 승인 상태를 관리하기 위한 
--       secondary_evaluation_step_approval 테이블을 생성하고,
--       기존 employee_evaluation_step_approval 테이블의 
--       secondaryEvaluationStatus가 'approved'인 경우 
--       모든 2차 평가자에 대해 새 테이블에 레코드를 생성합니다.
-- 실행일: 2025-01-XX
-- ============================================================

-- ============================================================
-- 1단계: 새 테이블 생성
-- ============================================================

-- 테이블 존재 여부 확인 후 생성
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'secondary_evaluation_step_approval'
    ) THEN
        CREATE TABLE secondary_evaluation_step_approval (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            
            -- 관계 필드
            evaluation_period_employee_mapping_id UUID NOT NULL,
            evaluator_id UUID NOT NULL,
            
            -- 승인 상태
            status VARCHAR(50) NOT NULL DEFAULT 'pending',
            -- 'pending' | 'approved' | 'revision_requested' | 'revision_completed'
            
            -- 승인 정보
            approved_by UUID NULL,
            approved_at TIMESTAMP WITH TIME ZONE NULL,
            
            -- 재작성 요청 정보 (재작성 요청 테이블과 연결)
            revision_request_id UUID NULL,
            
            -- 감사 정보
            created_by UUID NOT NULL,
            updated_by UUID NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            deleted_at TIMESTAMP WITH TIME ZONE NULL
        );
        
        -- 테이블 코멘트
        COMMENT ON TABLE secondary_evaluation_step_approval IS 
            '2차 평가자별 단계 승인 상태 관리 테이블 (평가자별 개별 승인 지원)';
        
        -- 컬럼 코멘트
        COMMENT ON COLUMN secondary_evaluation_step_approval.id IS 
            '2차 평가자별 단계 승인 ID';
        COMMENT ON COLUMN secondary_evaluation_step_approval.evaluation_period_employee_mapping_id IS 
            '평가기간-직원 맵핑 ID';
        COMMENT ON COLUMN secondary_evaluation_step_approval.evaluator_id IS 
            '2차 평가자 ID';
        COMMENT ON COLUMN secondary_evaluation_step_approval.status IS 
            '승인 상태 (pending, approved, revision_requested, revision_completed)';
        COMMENT ON COLUMN secondary_evaluation_step_approval.approved_by IS 
            '승인자 ID';
        COMMENT ON COLUMN secondary_evaluation_step_approval.approved_at IS 
            '승인 일시';
        COMMENT ON COLUMN secondary_evaluation_step_approval.revision_request_id IS 
            '재작성 요청 ID (evaluation_revision_request 테이블 참조)';
        
        RAISE NOTICE 'secondary_evaluation_step_approval 테이블이 성공적으로 생성되었습니다.';
    ELSE
        RAISE NOTICE 'secondary_evaluation_step_approval 테이블이 이미 존재합니다. 생성 작업을 건너뜁니다.';
    END IF;
END $$;

-- ============================================================
-- 2단계: 외래키 제약조건 추가
-- ============================================================

DO $$
BEGIN
    -- evaluation_period_employee_mapping 참조
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_secondary_approval_mapping'
        AND table_name = 'secondary_evaluation_step_approval'
    ) THEN
        ALTER TABLE secondary_evaluation_step_approval
        ADD CONSTRAINT fk_secondary_approval_mapping 
            FOREIGN KEY (evaluation_period_employee_mapping_id) 
            REFERENCES evaluation_period_employee_mapping(id)
            ON DELETE CASCADE;
        
        RAISE NOTICE 'fk_secondary_approval_mapping 제약조건이 추가되었습니다.';
    END IF;
    
    -- employee (evaluator) 참조
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_secondary_approval_evaluator'
        AND table_name = 'secondary_evaluation_step_approval'
    ) THEN
        ALTER TABLE secondary_evaluation_step_approval
        ADD CONSTRAINT fk_secondary_approval_evaluator 
            FOREIGN KEY (evaluator_id) 
            REFERENCES employee(id)
            ON DELETE CASCADE;
        
        RAISE NOTICE 'fk_secondary_approval_evaluator 제약조건이 추가되었습니다.';
    END IF;
    
    -- evaluation_revision_request 참조 (선택적)
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_secondary_approval_revision_request'
        AND table_name = 'secondary_evaluation_step_approval'
    ) THEN
        ALTER TABLE secondary_evaluation_step_approval
        ADD CONSTRAINT fk_secondary_approval_revision_request 
            FOREIGN KEY (revision_request_id) 
            REFERENCES evaluation_revision_request(id)
            ON DELETE SET NULL;
        
        RAISE NOTICE 'fk_secondary_approval_revision_request 제약조건이 추가되었습니다.';
    END IF;
END $$;

-- ============================================================
-- 3단계: 유니크 제약조건 추가
-- ============================================================
-- 평가기간-직원-평가자 조합당 1개만 존재하도록 제약
-- deleted_at이 NULL인 경우에만 유니크 적용

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'uk_secondary_approval_mapping_evaluator'
        AND table_name = 'secondary_evaluation_step_approval'
    ) THEN
        -- PostgreSQL의 부분 유니크 인덱스 사용 (deleted_at이 NULL인 경우만)
        CREATE UNIQUE INDEX uk_secondary_approval_mapping_evaluator 
        ON secondary_evaluation_step_approval(
            evaluation_period_employee_mapping_id, 
            evaluator_id
        )
        WHERE deleted_at IS NULL;
        
        RAISE NOTICE 'uk_secondary_approval_mapping_evaluator 유니크 인덱스가 생성되었습니다.';
    END IF;
END $$;

-- ============================================================
-- 4단계: 인덱스 생성
-- ============================================================

DO $$
BEGIN
    -- evaluation_period_employee_mapping_id 인덱스
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE indexname = 'idx_secondary_approval_mapping'
        AND tablename = 'secondary_evaluation_step_approval'
    ) THEN
        CREATE INDEX idx_secondary_approval_mapping 
        ON secondary_evaluation_step_approval(evaluation_period_employee_mapping_id);
        
        RAISE NOTICE 'idx_secondary_approval_mapping 인덱스가 생성되었습니다.';
    END IF;
    
    -- evaluator_id 인덱스
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE indexname = 'idx_secondary_approval_evaluator'
        AND tablename = 'secondary_evaluation_step_approval'
    ) THEN
        CREATE INDEX idx_secondary_approval_evaluator 
        ON secondary_evaluation_step_approval(evaluator_id);
        
        RAISE NOTICE 'idx_secondary_approval_evaluator 인덱스가 생성되었습니다.';
    END IF;
    
    -- status 인덱스
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE indexname = 'idx_secondary_approval_status'
        AND tablename = 'secondary_evaluation_step_approval'
    ) THEN
        CREATE INDEX idx_secondary_approval_status 
        ON secondary_evaluation_step_approval(status);
        
        RAISE NOTICE 'idx_secondary_approval_status 인덱스가 생성되었습니다.';
    END IF;
    
    -- 복합 인덱스 (맵핑 ID + 평가자 ID, 조회 성능 최적화)
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE indexname = 'idx_secondary_approval_mapping_evaluator'
        AND tablename = 'secondary_evaluation_step_approval'
    ) THEN
        CREATE INDEX idx_secondary_approval_mapping_evaluator 
        ON secondary_evaluation_step_approval(
            evaluation_period_employee_mapping_id, 
            evaluator_id
        );
        
        RAISE NOTICE 'idx_secondary_approval_mapping_evaluator 복합 인덱스가 생성되었습니다.';
    END IF;
END $$;

-- ============================================================
-- 5단계: 기존 데이터 마이그레이션
-- ============================================================
-- employee_evaluation_step_approval 테이블의 
-- secondaryEvaluationStatus가 'approved'인 경우,
-- 해당 평가기간-직원 맵핑에 대한 모든 2차 평가자에 대해
-- 새 테이블에 'approved' 상태로 레코드 생성

DO $$
DECLARE
    migrated_count INTEGER := 0;
    mapping_record RECORD;
    evaluator_id_var UUID;
    secondary_line_id UUID;
BEGIN
    -- SECONDARY 평가라인 ID 조회
    SELECT id INTO secondary_line_id
    FROM evaluation_lines
    WHERE "evaluatorType" = 'secondary'
    AND deleted_at IS NULL
    LIMIT 1;
    
    IF secondary_line_id IS NULL THEN
        RAISE NOTICE 'SECONDARY 평가라인이 존재하지 않습니다. 마이그레이션을 건너뜁니다.';
        RETURN;
    END IF;
    
    -- secondaryEvaluationStatus가 'approved'인 모든 stepApproval 조회
    FOR mapping_record IN
        SELECT 
            esa.id as step_approval_id,
            esa."evaluationPeriodEmployeeMappingId" as mapping_id,
            esa."secondaryEvaluationStatus" as status,
            esa."secondaryEvaluationApprovedBy" as approved_by,
            esa."secondaryEvaluationApprovedAt" as approved_at,
            esa."updatedBy" as updated_by,
            eem."evaluationPeriodId" as period_id,
            eem."employeeId" as employee_id
        FROM employee_evaluation_step_approval esa
        INNER JOIN evaluation_period_employee_mapping eem
            ON esa."evaluationPeriodEmployeeMappingId" = eem.id
        WHERE esa."secondaryEvaluationStatus" = 'approved'
        AND esa.deleted_at IS NULL
        AND eem.deleted_at IS NULL
    LOOP
        -- 해당 평가기간-직원 맵핑에 대한 모든 2차 평가자 조회
        FOR evaluator_id_var IN
            SELECT DISTINCT elm."evaluatorId"
            FROM evaluation_line_mappings elm
            INNER JOIN evaluation_lines el
                ON elm."evaluationLineId" = el.id
            WHERE elm."evaluationPeriodId" = mapping_record.period_id
            AND elm."employeeId" = mapping_record.employee_id
            AND elm."evaluatorId" IS NOT NULL
            AND elm.deleted_at IS NULL
            AND el."evaluatorType" = 'secondary'
            AND el.deleted_at IS NULL
        LOOP
            -- 이미 존재하는 레코드가 있는지 확인
            IF NOT EXISTS (
                SELECT 1
                FROM secondary_evaluation_step_approval
                WHERE "evaluationPeriodEmployeeMappingId" = mapping_record.mapping_id
                AND "evaluatorId" = evaluator_id_var
                AND deleted_at IS NULL
            ) THEN
                -- 새 레코드 생성
                INSERT INTO secondary_evaluation_step_approval (
                    "evaluationPeriodEmployeeMappingId",
                    "evaluatorId",
                    status,
                    "approvedBy",
                    "approvedAt",
                    "createdBy",
                    "updatedBy",
                    created_at,
                    updated_at
                ) VALUES (
                    mapping_record.mapping_id,
                    evaluator_id_var,
                    'approved',
                    mapping_record.approved_by,
                    mapping_record.approved_at,
                    COALESCE(mapping_record.updated_by, '00000000-0000-0000-0000-000000000000'::UUID),
                    COALESCE(mapping_record.updated_by, '00000000-0000-0000-0000-000000000000'::UUID),
                    COALESCE(mapping_record.approved_at, NOW()),
                    COALESCE(mapping_record.approved_at, NOW())
                );
                
                migrated_count := migrated_count + 1;
            END IF;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE '기존 데이터 마이그레이션 완료: % 개의 레코드가 생성되었습니다.', migrated_count;
END $$;

-- ============================================================
-- 실행 확인 쿼리
-- ============================================================
-- 마이그레이션 후 확인:
-- 
-- 1. 테이블 구조 확인:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
-- AND table_name = 'secondary_evaluation_step_approval'
-- ORDER BY ordinal_position;
-- 
-- 2. 마이그레이션된 데이터 확인:
-- SELECT 
--     COUNT(*) as total_records,
--     COUNT(DISTINCT "evaluationPeriodEmployeeMappingId") as unique_mappings,
--     COUNT(DISTINCT "evaluatorId") as unique_evaluators,
--     status,
--     COUNT(*) as count_by_status
-- FROM secondary_evaluation_step_approval
-- WHERE deleted_at IS NULL
-- GROUP BY status;
-- 
-- 3. 기존 approved 상태와 비교:
-- SELECT 
--     (SELECT COUNT(*) 
--      FROM employee_evaluation_step_approval 
--      WHERE "secondaryEvaluationStatus" = 'approved' 
--      AND deleted_at IS NULL) as old_approved_count,
--     (SELECT COUNT(DISTINCT "evaluationPeriodEmployeeMappingId")
--      FROM secondary_evaluation_step_approval
--      WHERE status = 'approved'
--      AND deleted_at IS NULL) as new_approved_mappings;
-- ============================================================

-- ============================================================
-- 롤백 스크립트 (필요시 사용)
-- ============================================================
-- 만약 롤백이 필요한 경우 아래 스크립트를 실행하세요:
-- 
-- -- 1. 외래키 제약조건 삭제
-- ALTER TABLE secondary_evaluation_step_approval
-- DROP CONSTRAINT IF EXISTS fk_secondary_approval_revision_request;
-- 
-- ALTER TABLE secondary_evaluation_step_approval
-- DROP CONSTRAINT IF EXISTS fk_secondary_approval_evaluator;
-- 
-- ALTER TABLE secondary_evaluation_step_approval
-- DROP CONSTRAINT IF EXISTS fk_secondary_approval_mapping;
-- 
-- -- 2. 인덱스 삭제
-- DROP INDEX IF EXISTS idx_secondary_approval_mapping_evaluator;
-- DROP INDEX IF EXISTS idx_secondary_approval_status;
-- DROP INDEX IF EXISTS idx_secondary_approval_evaluator;
-- DROP INDEX IF EXISTS idx_secondary_approval_mapping;
-- DROP INDEX IF EXISTS uk_secondary_approval_mapping_evaluator;
-- 
-- -- 3. 테이블 삭제
-- DROP TABLE IF EXISTS secondary_evaluation_step_approval;
-- ============================================================

