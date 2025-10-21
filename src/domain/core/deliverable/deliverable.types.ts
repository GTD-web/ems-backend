/**
 * 산출물 유형
 */
export enum DeliverableType {
  DOCUMENT = 'document',
  CODE = 'code',
  DESIGN = 'design',
  REPORT = 'report',
  PRESENTATION = 'presentation',
  OTHER = 'other',
}

/**
 * 산출물 생성 데이터
 */
export interface CreateDeliverableData {
  /** 산출물명 */
  name: string;
  /** 산출물 설명 */
  description?: string;
  /** 산출물 유형 */
  type: DeliverableType;
  /** 파일 경로 */
  filePath?: string;
  /** 직원 ID */
  employeeId?: string;
  /** WBS 항목 ID */
  wbsItemId?: string;
  /** 매핑자 ID */
  mappedBy?: string;
  /** 매핑일 */
  mappedDate?: Date;
  /** 활성 상태 */
  isActive?: boolean;
  /** 생성자 ID */
  createdBy: string;
}

/**
 * 산출물 수정 데이터
 */
export interface UpdateDeliverableData {
  /** 산출물명 */
  name?: string;
  /** 산출물 설명 */
  description?: string;
  /** 산출물 유형 */
  type?: DeliverableType;
  /** 파일 경로 */
  filePath?: string;
  /** 직원 ID */
  employeeId?: string;
  /** WBS 항목 ID */
  wbsItemId?: string;
  /** 활성 상태 */
  isActive?: boolean;
}

/**
 * 산출물 DTO
 */
export interface DeliverableDto {
  /** 산출물 고유 식별자 */
  id: string;
  /** 산출물명 */
  name: string;
  /** 산출물 설명 */
  description?: string;
  /** 산출물 유형 */
  type: DeliverableType;
  /** 파일 경로 */
  filePath?: string;
  /** 직원 ID */
  employeeId?: string;
  /** WBS 항목 ID */
  wbsItemId?: string;
  /** 매핑일 */
  mappedDate?: Date;
  /** 매핑자 ID */
  mappedBy?: string;
  /** 활성 상태 */
  isActive: boolean;
  /** 생성일시 */
  createdAt: Date;
  /** 수정일시 */
  updatedAt: Date;
  /** 삭제일시 */
  deletedAt?: Date;
  /** 생성자 ID */
  createdBy?: string;
  /** 수정자 ID */
  updatedBy?: string;
  /** 버전 */
  version: number;
}

/**
 * 산출물 필터
 */
export interface DeliverableFilter {
  /** 산출물 유형 */
  type?: DeliverableType;
  /** 직원 ID */
  employeeId?: string;
  /** WBS 항목 ID */
  wbsItemId?: string;
  /** 매핑자 ID */
  mappedBy?: string;
  /** 활성 산출물만 조회 */
  activeOnly?: boolean;
  /** 비활성 산출물만 조회 */
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

/**
 * 산출물 통계
 */
export interface DeliverableStatistics {
  /** 전체 산출물 수 */
  totalDeliverables: number;
  /** 유형별 통계 */
  typeCounts: Record<DeliverableType, number>;
  /** 활성 산출물 수 */
  activeDeliverables: number;
  /** 비활성 산출물 수 */
  inactiveDeliverables: number;
  /** WBS 항목별 산출물 수 */
  deliverablesByWbsItem: Record<string, number>;
  /** 직원별 산출물 수 */
  deliverablesByEmployee: Record<string, number>;
}
