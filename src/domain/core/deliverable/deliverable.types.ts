/**
 * 산출물 상태
 */
export enum DeliverableStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
}

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
 * 산출물 생성 DTO
 */
export interface CreateDeliverableDto {
  /** WBS 항목 ID */
  wbsItemId: string;
  /** 산출물명 */
  name: string;
  /** 산출물 설명 */
  description?: string;
  /** 산출물 유형 */
  type: DeliverableType;
  /** 예상 완료일 */
  expectedCompletionDate?: Date;
  /** 파일 경로 */
  filePath?: string;
  /** 파일 크기 (bytes) */
  fileSize?: number;
  /** MIME 타입 */
  mimeType?: string;
}

/**
 * 산출물 업데이트 DTO
 */
export interface UpdateDeliverableDto {
  /** 산출물명 */
  name?: string;
  /** 산출물 설명 */
  description?: string;
  /** 산출물 유형 */
  type?: DeliverableType;
  /** 예상 완료일 */
  expectedCompletionDate?: Date;
  /** 실제 완료일 */
  actualCompletionDate?: Date;
  /** 상태 */
  status?: DeliverableStatus;
  /** 파일 경로 */
  filePath?: string;
  /** 파일 크기 (bytes) */
  fileSize?: number;
  /** MIME 타입 */
  mimeType?: string;
}

/**
 * 산출물 DTO
 */
export interface DeliverableDto {
  /** 산출물 고유 식별자 */
  id: string;
  /** WBS 항목 ID */
  wbsItemId: string;
  /** 산출물명 */
  name: string;
  /** 산출물 설명 */
  description?: string;
  /** 산출물 유형 */
  type: DeliverableType;
  /** 상태 */
  status: DeliverableStatus;
  /** 예상 완료일 */
  expectedCompletionDate?: Date;
  /** 실제 완료일 */
  actualCompletionDate?: Date;
  /** 파일 경로 */
  filePath?: string;
  /** 파일 크기 (bytes) */
  fileSize?: number;
  /** MIME 타입 */
  mimeType?: string;
  /** 생성일시 */
  createdAt: Date;
  /** 수정일시 */
  updatedAt: Date;
}

/**
 * 산출물 필터
 */
export interface DeliverableFilter {
  /** WBS 항목 ID */
  wbsItemId?: string;
  /** 산출물 유형 */
  type?: DeliverableType;
  /** 상태 */
  status?: DeliverableStatus;
  /** 완료된 산출물만 조회 */
  completedOnly?: boolean;
  /** 대기중인 산출물만 조회 */
  pendingOnly?: boolean;
  /** 예상 완료일 범위 - 시작 */
  expectedCompletionDateFrom?: Date;
  /** 예상 완료일 범위 - 종료 */
  expectedCompletionDateTo?: Date;
  /** 실제 완료일 범위 - 시작 */
  actualCompletionDateFrom?: Date;
  /** 실제 완료일 범위 - 종료 */
  actualCompletionDateTo?: Date;
}

/**
 * 산출물 통계
 */
export interface DeliverableStatistics {
  /** 전체 산출물 수 */
  totalDeliverables: number;
  /** 상태별 통계 */
  statusCounts: Record<DeliverableStatus, number>;
  /** 유형별 통계 */
  typeCounts: Record<DeliverableType, number>;
  /** 완료된 산출물 수 */
  completedDeliverables: number;
  /** 진행중인 산출물 수 */
  inProgressDeliverables: number;
  /** 지연된 산출물 수 */
  delayedDeliverables: number;
  /** 평균 완료 소요 시간 (일) */
  averageCompletionDays: number;
  /** WBS 항목별 산출물 수 */
  deliverablesByWbsItem: Record<string, number>;
}
