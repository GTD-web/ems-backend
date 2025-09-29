/**
 * 평가 프로젝트 할당 관련 타입 정의
 */

/**
 * 평가 프로젝트 할당 DTO
 */
export interface EvaluationProjectAssignmentDto {
  /** 고유 식별자 (UUID) */
  id: string;
  /** 평가 기간 ID */
  periodId: string;
  /** 직원 ID */
  employeeId: string;
  /** 프로젝트 ID */
  projectId: string;
  /** 할당일 */
  assignedDate: Date;
  /** 할당자 ID */
  assignedBy: string;
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

  // 조인된 정보 (선택적)
  /** 평가기간 이름 */
  periodName?: string;
  /** 직원 이름 */
  employeeName?: string;
  /** 프로젝트 이름 */
  projectName?: string;
  /** 할당자 이름 */
  assignedByName?: string;
}

/**
 * 평가 프로젝트 할당 생성 데이터
 */
export interface CreateEvaluationProjectAssignmentData {
  /** 평가 기간 ID */
  periodId: string;
  /** 직원 ID */
  employeeId: string;
  /** 프로젝트 ID */
  projectId: string;
  /** 할당자 ID */
  assignedBy: string;
}

/**
 * 평가 프로젝트 할당 수정 데이터
 */
export interface UpdateEvaluationProjectAssignmentData {
  /** 할당자 ID */
  assignedBy?: string;
}

/**
 * 평가 프로젝트 할당 필터
 */
export interface EvaluationProjectAssignmentFilter {
  /** 평가 기간 ID */
  periodId?: string;
  /** 직원 ID */
  employeeId?: string;
  /** 프로젝트 ID */
  projectId?: string;
  /** 할당자 ID */
  assignedBy?: string;
  /** 할당일 시작 */
  assignedDateFrom?: Date;
  /** 할당일 종료 */
  assignedDateTo?: Date;
}

/**
 * 평가 프로젝트 할당 통계
 */
export interface EvaluationProjectAssignmentStatistics {
  /** 전체 할당 수 */
  totalAssignments: number;
  /** 평가기간별 할당 수 */
  assignmentsByPeriod: Record<string, number>;
  /** 직원별 할당 수 */
  assignmentsByEmployee: Record<string, number>;
  /** 프로젝트별 할당 수 */
  assignmentsByProject: Record<string, number>;
}
