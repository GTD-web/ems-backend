/**
 * 산출물 매핑 관련 타입 정의
 */

/**
 * 산출물 매핑 DTO
 */
export interface DeliverableMappingDto {
  /** 고유 식별자 (UUID) */
  id: string;
  /** 직원 ID */
  employeeId: string;
  /** WBS 항목 ID */
  wbsItemId: string;
  /** 산출물 ID */
  deliverableId: string;
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

  // 조인된 정보 (선택적)
  /** 직원 이름 */
  employeeName?: string;
  /** WBS 항목 이름 */
  wbsItemName?: string;
  /** 산출물 이름 */
  deliverableName?: string;
  /** 매핑자 이름 */
  mappedByName?: string;
}

/**
 * 산출물 매핑 상세 DTO (관련 정보 포함)
 */
export interface DeliverableMappingDetailDto {
  /** 고유 식별자 (UUID) */
  id: string;
  /** 매핑일 */
  mappedDate: Date;
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

  /** 산출물 정보 */
  deliverable?: {
    id: string;
    name: string;
    description?: string;
    type: string;
    status: string;
    filePath?: string;
    fileSize?: number;
    mimeType?: string;
  } | null;

  /** 매핑자 정보 */
  mappedBy?: {
    id: string;
    employeeNumber: string;
    name: string;
    email?: string;
    departmentId?: string;
    departmentName?: string;
  } | null;
}

/**
 * 산출물 매핑 생성 데이터
 */
export interface CreateDeliverableMappingData {
  /** 직원 ID */
  employeeId: string;
  /** WBS 항목 ID */
  wbsItemId: string;
  /** 산출물 ID */
  deliverableId: string;
  /** 매핑자 ID */
  mappedBy: string;
}

/**
 * 산출물 매핑 수정 데이터
 */
export interface UpdateDeliverableMappingData {
  /** 산출물 ID */
  deliverableId?: string;
  /** 활성 상태 */
  isActive?: boolean;
}

/**
 * 산출물 매핑 필터
 */
export interface DeliverableMappingFilter {
  /** 직원 ID */
  employeeId?: string;
  /** WBS 항목 ID */
  wbsItemId?: string;
  /** 산출물 ID */
  deliverableId?: string;
  /** 매핑자 ID */
  mappedBy?: string;
  /** 활성 매핑만 조회 */
  activeOnly?: boolean;
  /** 비활성 매핑만 조회 */
  inactiveOnly?: boolean;
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
