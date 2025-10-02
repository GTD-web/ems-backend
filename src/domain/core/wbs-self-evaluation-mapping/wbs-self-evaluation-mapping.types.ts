/**
 * WBS 자가평가 매핑 관련 타입 정의
 */

/**
 * WBS 자가평가 매핑 DTO
 */
export interface WbsSelfEvaluationMappingDto {
  /** 고유 식별자 (UUID) */
  id: string;
  /** 평가 기간 ID */
  periodId: string;
  /** 직원 ID */
  employeeId: string;
  /** WBS 항목 ID */
  wbsItemId: string;
  /** 할당일 */
  assignedDate: Date;
  /** 할당자 ID */
  assignedBy: string;
  /** 자가평가 완료 여부 */
  isCompleted: boolean;
  /** 완료일 */
  completedAt?: Date;
  /** 자가평가 ID */
  selfEvaluationId?: string;
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
  /** WBS 항목 이름 */
  wbsItemName?: string;
  /** 할당자 이름 */
  assignedByName?: string;
}

/**
 * WBS 자가평가 매핑 상세 DTO (관련 정보 포함)
 */
export interface WbsSelfEvaluationMappingDetailDto {
  /** 고유 식별자 (UUID) */
  id: string;
  /** 할당일 */
  assignedDate: Date;
  /** 자가평가 완료 여부 */
  isCompleted: boolean;
  /** 완료일 */
  completedAt?: Date;
  /** 자가평가 ID */
  selfEvaluationId?: string;
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

  /** 평가기간 정보 */
  evaluationPeriod?: {
    id: string;
    name: string;
    startDate: Date;
    endDate?: Date;
    status: string;
    description?: string;
  } | null;

  /** 직원 정보 */
  employee?: {
    id: string;
    employeeNumber: string;
    name: string;
    email?: string;
    phoneNumber?: string;
    status: string;
    departmentId?: string;
    departmentName?: string;
  } | null;

  /** WBS 항목 정보 */
  wbsItem?: {
    id: string;
    name: string;
    description?: string;
    projectId: string;
    projectName?: string;
    status: string;
  } | null;

  /** 할당자 정보 */
  assignedBy?: {
    id: string;
    employeeNumber: string;
    name: string;
    email?: string;
    departmentId?: string;
    departmentName?: string;
  } | null;
}

/**
 * WBS 자가평가 매핑 생성 데이터
 */
export interface CreateWbsSelfEvaluationMappingData {
  /** 평가 기간 ID */
  periodId: string;
  /** 직원 ID */
  employeeId: string;
  /** WBS 항목 ID */
  wbsItemId: string;
  /** 할당자 ID */
  assignedBy: string;
}

/**
 * WBS 자가평가 매핑 수정 데이터
 */
export interface UpdateWbsSelfEvaluationMappingData {
  /** 할당자 ID */
  assignedBy?: string;
  /** 자가평가 완료 여부 */
  isCompleted?: boolean;
  /** 자가평가 ID */
  selfEvaluationId?: string;
}

/**
 * WBS 자가평가 매핑 필터
 */
export interface WbsSelfEvaluationMappingFilter {
  /** 평가 기간 ID */
  periodId?: string;
  /** 직원 ID */
  employeeId?: string;
  /** WBS 항목 ID */
  wbsItemId?: string;
  /** 할당자 ID */
  assignedBy?: string;
  /** 완료된 매핑만 조회 */
  completedOnly?: boolean;
  /** 미완료 매핑만 조회 */
  uncompletedOnly?: boolean;
  /** 할당일 시작 */
  assignedDateFrom?: Date;
  /** 할당일 종료 */
  assignedDateTo?: Date;
  /** 완료일 시작 */
  completedDateFrom?: Date;
  /** 완료일 종료 */
  completedDateTo?: Date;
  /** 페이지 번호 (1부터 시작) */
  page?: number;
  /** 페이지 크기 */
  limit?: number;
  /** 정렬 기준 */
  orderBy?: string;
  /** 정렬 방향 */
  orderDirection?: 'ASC' | 'DESC';
}
