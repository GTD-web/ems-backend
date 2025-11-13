-- ============================================================
-- 평가 기간 테이블에서 endDate 컬럼 삭제 DDL (간단 버전)
-- ============================================================
-- 설명: evaluation_period 테이블에서 endDate 컬럼을 삭제합니다.
--       엔티티에서 endDate 필드가 제거되었으므로 데이터베이스 스키마도 동기화합니다.
-- 
-- 주의: 이 스크립트는 컬럼이 존재하지 않으면 에러가 발생할 수 있습니다.
--       안전한 버전은 remove-enddate-from-evaluation-period.sql을 사용하세요.
-- ============================================================

-- endDate 컬럼 삭제
ALTER TABLE evaluation_period DROP COLUMN IF EXISTS "endDate";

-- ============================================================
-- 실행 확인 쿼리
-- ============================================================
-- 삭제 후 확인:
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
-- AND table_name = 'evaluation_period' 
-- AND column_name = 'endDate';
-- 
-- 결과가 없으면 정상적으로 삭제된 것입니다.
-- ============================================================

