/**
 * WBS 자가평가 관련 타입 정의
 */

/**
 * WBS 자가평가 DTO
 */
export interface WbsSelfEvaluationDto {
  /** 고유 식별자 (UUID) */
  id: string;
  /** 평가 기간 ID */
  periodId: string;
  /** 직원 ID */
  employeeId: string;
  /** WBS 항목 ID */
  wbsItemId: string;
  /** 할당자 ID */
  assignedBy: string;
  /** 할당일 */
  assignedDate: Date;
  /** 자가평가 완료 여부 */
  isCompleted: boolean;
  /** 완료일 */
  completedAt?: Date;
  /** 평가일 */
  evaluationDate: Date;
  /** 성과 입력 (실제 달성한 성과 및 결과) */
  performanceResult?: string;
  /** 자가평가 내용 */
  selfEvaluationContent: string;
  /** 자가평가 점수 (1-5) */
  selfEvaluationScore: number;
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
 * WBS 자가평가 상세 DTO (관련 정보 포함)
 */
export interface WbsSelfEvaluationDetailDto {
  /** 고유 식별자 (UUID) */
  id: string;
  /** 평가 기간 ID */
  periodId: string;
  /** 직원 ID */
  employeeId: string;
  /** WBS 항목 ID */
  wbsItemId: string;
  /** 할당자 ID */
  assignedBy: string;
  /** 할당일 */
  assignedDate: Date;
  /** 자가평가 완료 여부 */
  isCompleted: boolean;
  /** 완료일 */
  completedAt?: Date;
  /** 평가일 */
  evaluationDate: Date;
  /** 성과 입력 (실제 달성한 성과 및 결과) */
  performanceResult?: string;
  /** 자가평가 내용 */
  selfEvaluationContent: string;
  /** 자가평가 점수 (1-5) */
  selfEvaluationScore: number;
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
 * WBS 자가평가 생성 데이터
 */
export interface CreateWbsSelfEvaluationData {
  /** 평가 기간 ID */
  periodId: string;
  /** 직원 ID */
  employeeId: string;
  /** WBS 항목 ID */
  wbsItemId: string;
  /** 할당자 ID */
  assignedBy: string;
  /** 성과 입력 (실제 달성한 성과 및 결과) */
  performanceResult?: string;
  /** 자가평가 내용 */
  selfEvaluationContent: string;
  /** 자가평가 점수 (1-5) */
  selfEvaluationScore: number;
  /** 생성자 ID */
  createdBy: string;
}

/**
 * WBS 자가평가 수정 데이터
 */
export interface UpdateWbsSelfEvaluationData {
  /** 할당자 ID */
  assignedBy?: string;
  /** 자가평가 완료 여부 */
  isCompleted?: boolean;
  /** 성과 입력 (실제 달성한 성과 및 결과) */
  performanceResult?: string;
  /** 자가평가 내용 */
  selfEvaluationContent?: string;
  /** 자가평가 점수 (1-5) */
  selfEvaluationScore?: number;
}

/**
 * WBS 자가평가 필터
 */
export interface WbsSelfEvaluationFilter {
  /** 평가 기간 ID */
  periodId?: string;
  /** 직원 ID */
  employeeId?: string;
  /** WBS 항목 ID */
  wbsItemId?: string;
  /** 할당자 ID */
  assignedBy?: string;
  /** 완료된 자가평가만 조회 */
  completedOnly?: boolean;
  /** 미완료 자가평가만 조회 */
  uncompletedOnly?: boolean;
  /** 할당일 시작 */
  assignedDateFrom?: Date;
  /** 할당일 종료 */
  assignedDateTo?: Date;
  /** 완료일 시작 */
  completedDateFrom?: Date;
  /** 완료일 종료 */
  completedDateTo?: Date;
  /** 평가일 시작 */
  evaluationDateFrom?: Date;
  /** 평가일 종료 */
  evaluationDateTo?: Date;
  /** 점수 범위 시작 */
  scoreFrom?: number;
  /** 점수 범위 종료 */
  scoreTo?: number;
  /** 페이지 번호 (1부터 시작) */
  page?: number;
  /** 페이지 크기 */
  limit?: number;
  /** 정렬 기준 */
  orderBy?: string;
  /** 정렬 방향 */
  orderDirection?: 'ASC' | 'DESC';
}
