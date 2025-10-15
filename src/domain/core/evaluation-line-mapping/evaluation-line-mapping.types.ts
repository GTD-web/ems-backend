/**
 * 평가 라인 맵핑 관련 타입 정의
 */

/**
 * 평가 라인 맵핑 DTO
 */
export interface EvaluationLineMappingDto {
  /** 고유 식별자 (UUID) */
  id: string;
  /** 피평가자 ID - 평가를 받는 직원 식별자 */
  employeeId: string;
  /** 평가자 ID - 평가를 수행하는 직원 식별자 */
  evaluatorId: string;
  /** WBS 항목 ID - 평가가 수행되는 WBS 항목 식별자 (선택적) */
  wbsItemId?: string;
  /** 평가 라인 ID - 실제 평가 라인 엔티티 식별자 */
  evaluationLineId: string;
  /** 생성자 ID - 맵핑을 생성한 직원 식별자 (선택적) */
  createdBy?: string;
  /** 수정자 ID - 맵핑을 마지막으로 수정한 직원 식별자 (선택적) */
  updatedBy?: string;
  /** 생성 일시 */
  createdAt: Date;
  /** 수정 일시 */
  updatedAt: Date;
}

/**
 * 평가 라인 맵핑 생성 데이터
 */
export interface CreateEvaluationLineMappingData {
  employeeId: string;
  evaluatorId: string;
  wbsItemId?: string;
  evaluationLineId: string;
  createdBy: string;
}

/**
 * 평가 라인 맵핑 업데이트 데이터
 */
export interface UpdateEvaluationLineMappingData {
  evaluatorId?: string;
  evaluationLineId?: string;
  wbsItemId?: string;
  updatedBy?: string;
}

/**
 * 평가 라인 맵핑 필터
 */
export interface EvaluationLineMappingFilter {
  employeeId?: string;
  evaluatorId?: string;
  wbsItemId?: string;
  evaluationLineId?: string;
  createdBy?: string;
  updatedBy?: string;
  /** WBS 항목이 연결된 맵핑만 조회 */
  withWbsItem?: boolean;
}
