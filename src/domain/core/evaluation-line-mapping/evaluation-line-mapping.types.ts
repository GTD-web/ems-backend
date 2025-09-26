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
  /** 프로젝트 ID - 평가가 수행되는 프로젝트 식별자 (선택적) */
  projectId?: string;
  /** 평가 라인 ID - 실제 평가 라인 엔티티 식별자 */
  evaluationLineId: string;
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
  projectId?: string;
  evaluationLineId: string;
}

/**
 * 평가 라인 맵핑 업데이트 데이터
 */
export interface UpdateEvaluationLineMappingData {
  evaluationLineId?: string;
  projectId?: string;
}

/**
 * 평가 라인 맵핑 필터
 */
export interface EvaluationLineMappingFilter {
  employeeId?: string;
  evaluatorId?: string;
  projectId?: string;
  evaluationLineId?: string;
  /** 프로젝트가 연결된 맵핑만 조회 */
  withProject?: boolean;
}
