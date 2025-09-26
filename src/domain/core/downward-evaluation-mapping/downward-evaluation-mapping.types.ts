import { DownwardEvaluationType } from '../downward-evaluation/downward-evaluation.types';

/**
 * 하향평가 맵핑 관련 타입 정의
 */

/**
 * 하향평가 맵핑 DTO
 */
export interface DownwardEvaluationMappingDto {
  /** 고유 식별자 (UUID) */
  id: string;
  /** 피평가자 ID - 평가를 받는 직원 식별자 */
  employeeId: string;
  /** 평가자 ID - 평가를 수행하는 직원 식별자 */
  evaluatorId: string;
  /** 프로젝트 ID - 평가가 수행되는 프로젝트 식별자 */
  projectId: string;
  /** 평가 기간 ID - 평가가 수행되는 평가 기간 */
  periodId: string;
  /** 하향평가 ID - 실제 하향평가 엔티티 식별자 */
  downwardEvaluationId: string;
  /** 자기평가 ID - 연결된 자기평가 엔티티 식별자 (선택적) */
  selfEvaluationId?: string;
  /** 생성 일시 */
  createdAt: Date;
  /** 수정 일시 */
  updatedAt: Date;
}

/**
 * 하향평가 맵핑 생성 데이터
 */
export interface CreateDownwardEvaluationMappingData {
  employeeId: string;
  evaluatorId: string;
  projectId: string;
  periodId: string;
  downwardEvaluationId: string;
  selfEvaluationId?: string;
}

/**
 * 하향평가 맵핑 업데이트 데이터
 */
export interface UpdateDownwardEvaluationMappingData {
  downwardEvaluationId?: string;
  selfEvaluationId?: string;
}

/**
 * 하향평가 맵핑 필터
 */
export interface DownwardEvaluationMappingFilter {
  employeeId?: string;
  evaluatorId?: string;
  projectId?: string;
  periodId?: string;
  downwardEvaluationId?: string;
  selfEvaluationId?: string;
  /** 자기평가가 연결된 맵핑만 조회 */
  withSelfEvaluation?: boolean;
}
