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
 * 산출물 생성 데이터
 */
export interface CreateDeliverableData {
  /** 산출물명 */
  name: string;
  /** 산출물 설명 */
  description?: string;
  /** 산출물 유형 */
  type: DeliverableType;
  /** 산출물 상태 */
  status?: DeliverableStatus;
  /** 예상 완료일 */
  expectedCompletionDate?: Date;
  /** 파일 경로 */
  filePath?: string;
  /** 파일 크기 (bytes) */
  fileSize?: number;
  /** MIME 타입 */
  mimeType?: string;
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
  /** 예상 완료일 */
  expectedCompletionDate?: Date;
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
