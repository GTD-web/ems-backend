/**
 * WBS 자기평가 맵핑 관련 타입 정의
 */

/**
 * WBS 자기평가 맵핑 DTO
 */
export interface WbsSelfEvaluationMappingDto {
  /** 고유 식별자 (UUID) */
  id: string;
  /** 프로젝트 ID - WBS 항목이 속한 프로젝트 식별자 */
  projectId: string;
  /** 직원 ID - 자기평가를 수행하는 직원 식별자 */
  employeeId: string;
  /** WBS 항목 ID - 자기평가 대상 WBS 항목 식별자 */
  wbsItemId: string;
  /** 평가 기간 ID - 자기평가가 수행되는 평가 기간 */
  periodId: string;
  /** 자기평가 ID - 실제 자기평가 엔티티 식별자 */
  selfEvaluationId: string;
  /** 생성 일시 */
  createdAt: Date;
  /** 수정 일시 */
  updatedAt: Date;
}

/**
 * WBS 자기평가 맵핑 생성 데이터
 */
export interface CreateWbsSelfEvaluationMappingData {
  projectId: string;
  employeeId: string;
  wbsItemId: string;
  periodId: string;
  selfEvaluationId: string;
}

/**
 * WBS 자기평가 맵핑 업데이트 데이터
 */
export interface UpdateWbsSelfEvaluationMappingData {
  selfEvaluationId?: string;
}

/**
 * WBS 자기평가 맵핑 필터
 */
export interface WbsSelfEvaluationMappingFilter {
  projectId?: string;
  employeeId?: string;
  wbsItemId?: string;
  periodId?: string;
  selfEvaluationId?: string;
}
