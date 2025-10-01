import { DownwardEvaluationType } from '../downward-evaluation/downward-evaluation.types';

/**
 * 하향평가 맵핑 관련 타입 정의
 */

/**
 * 하향평가 매핑 DTO
 */
export interface DownwardEvaluationMappingDto {
  /** 고유 식별자 (UUID) */
  id: string;
  /** 피평가자 ID */
  employeeId: string;
  /** 평가자 ID */
  evaluatorId: string;
  /** 프로젝트 ID */
  projectId: string;
  /** 평가 기간 ID */
  periodId: string;
  /** 하향평가 ID */
  downwardEvaluationId: string;
  /** 자기평가 ID */
  selfEvaluationId?: string;
  /** 매핑일 */
  mappedDate: Date;
  /** 매핑자 ID */
  mappedBy: string;
  /** 활성 상태 */
  isActive: boolean;
  /** 생성 일시 */
  createdAt: Date;
  /** 수정 일시 */
  updatedAt: Date;
  /** 삭제 일시 */
  deletedAt?: Date;
  /** 생성자 ID */
  createdBy?: string;
  /** 수정자 ID */
  updatedBy?: string;
  /** 버전 */
  version: number;
}

/**
 * 하향평가 매핑 생성 데이터
 */
export interface CreateDownwardEvaluationMappingData {
  /** 피평가자 ID */
  employeeId: string;
  /** 평가자 ID */
  evaluatorId: string;
  /** 프로젝트 ID */
  projectId: string;
  /** 평가 기간 ID */
  periodId: string;
  /** 하향평가 ID */
  downwardEvaluationId: string;
  /** 자기평가 ID */
  selfEvaluationId?: string;
  /** 매핑자 ID */
  mappedBy: string;
}

/**
 * 하향평가 매핑 수정 데이터
 */
export interface UpdateDownwardEvaluationMappingData {
  /** 하향평가 ID */
  downwardEvaluationId?: string;
  /** 자기평가 ID */
  selfEvaluationId?: string;
  /** 활성 상태 */
  isActive?: boolean;
}

/**
 * 하향평가 매핑 필터
 */
export interface DownwardEvaluationMappingFilter {
  /** 피평가자 ID */
  employeeId?: string;
  /** 평가자 ID */
  evaluatorId?: string;
  /** 프로젝트 ID */
  projectId?: string;
  /** 평가 기간 ID */
  periodId?: string;
  /** 하향평가 ID */
  downwardEvaluationId?: string;
  /** 자기평가 ID */
  selfEvaluationId?: string;
  /** 매핑자 ID */
  mappedBy?: string;
  /** 활성 매핑만 조회 */
  activeOnly?: boolean;
  /** 비활성 매핑만 조회 */
  inactiveOnly?: boolean;
  /** 자기평가가 연결된 매핑만 조회 */
  withSelfEvaluation?: boolean;
  /** 자기평가가 연결되지 않은 매핑만 조회 */
  withoutSelfEvaluation?: boolean;
  /** 매핑일 시작 */
  mappedDateFrom?: Date;
  /** 매핑일 종료 */
  mappedDateTo?: Date;
  /** 페이지 번호 (1부터 시작) */
  page?: number;
  /** 페이지 크기 */
  limit?: number;
  /** 정렬 기준 */
  orderBy?: string;
  /** 정렬 방향 */
  orderDirection?: 'ASC' | 'DESC';
}
