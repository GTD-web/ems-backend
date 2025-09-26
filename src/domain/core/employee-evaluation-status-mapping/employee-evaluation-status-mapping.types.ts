import { EvaluationElementType } from './interfaces/employee-evaluation-status-mapping.interface';

/**
 * 직원 평가 상태 맵핑 관련 타입 정의
 * WBS 항목과 직원 평가 상태 간의 관계를 관리합니다.
 */

/**
 * 직원 평가 상태 맵핑 DTO
 */
export interface EmployeeEvaluationStatusMappingDto {
  /** 고유 식별자 (UUID) */
  id: string;
  /** 직원 ID - 평가를 받는 직원 식별자 */
  employeeId: string;
  /** 평가 기간 ID - 평가가 수행되는 평가 기간 */
  periodId: string;
  /** 직원 평가 상태 ID - 실제 평가 상태 엔티티 식별자 */
  evaluationStatusId: string;
  /** 평가 요소 타입 (WBS 항목) */
  elementType: EvaluationElementType;
  /** WBS 항목 ID - WBS 항목 식별자 */
  elementId: string;
  /** 평가자 ID - 평가를 수행하는 직원 식별자 (선택적) */
  evaluatorId?: string;
  /** 프로젝트 ID - WBS 항목이 속한 프로젝트 식별자 (선택적) */
  projectId?: string;
  /** 생성 일시 */
  createdAt: Date;
  /** 수정 일시 */
  updatedAt: Date;
}

/**
 * 직원 평가 상태 맵핑 생성 데이터
 */
export interface CreateEmployeeEvaluationStatusMappingData {
  employeeId: string;
  periodId: string;
  evaluationStatusId: string;
  elementType: EvaluationElementType;
  elementId: string;
  evaluatorId?: string;
  projectId?: string;
}

/**
 * 직원 평가 상태 맵핑 업데이트 데이터
 */
export interface UpdateEmployeeEvaluationStatusMappingData {
  elementId?: string;
  evaluatorId?: string;
  projectId?: string;
}

/**
 * 직원 평가 상태 맵핑 필터
 */
export interface EmployeeEvaluationStatusMappingFilter {
  employeeId?: string;
  periodId?: string;
  evaluationStatusId?: string;
  elementType?: EvaluationElementType;
  elementId?: string;
  evaluatorId?: string;
  projectId?: string;
  /** WBS 항목 요소만 조회 */
  wbsItemOnly?: boolean;
}

/**
 * 평가 요소별 집계 정보
 */
export interface EvaluationElementSummary {
  /** 평가 요소 타입 */
  elementType: EvaluationElementType;
  /** 총 평가 요소 수 */
  totalCount: number;
  /** 완료된 평가 요소 수 */
  completedCount: number;
  /** 진행중인 평가 요소 수 */
  inProgressCount: number;
  /** 미완료 평가 요소 수 */
  pendingCount: number;
  /** 완료율 (%) */
  completionRate: number;
}

/**
 * 직원 평가 상태 맵핑 통계
 */
export interface EmployeeEvaluationStatusMappingStatistics {
  /** 전체 맵핑 수 */
  totalMappings: number;
  /** 평가 요소 타입별 통계 */
  elementTypeCounts: Record<EvaluationElementType, number>;
  /** 평가 요소별 집계 정보 */
  elementSummaries: EvaluationElementSummary[];
  /** 직원별 평가 요소 수 */
  mappingsByEmployee: Record<string, number>;
  /** 평가 기간별 평가 요소 수 */
  mappingsByPeriod: Record<string, number>;
  /** 프로젝트별 평가 요소 수 */
  mappingsByProject: Record<string, number>;
}
