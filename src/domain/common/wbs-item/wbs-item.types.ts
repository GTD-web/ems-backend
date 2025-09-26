/**
 * WBS 항목 관련 타입 정의 (평가 시스템 전용)
 */

// WBS 항목 상태 enum
export enum WbsItemStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ON_HOLD = 'ON_HOLD',
}

// WBS 항목 우선순위는 평가 시스템에서 불필요하므로 제거

/**
 * WBS 항목 DTO (평가 시스템 전용)
 * 평가 시스템에서 사용하는 WBS 항목 정보만 포함
 */
export interface WbsItemDto {
  // BaseEntity 필드들
  /** 고유 식별자 (UUID) */
  id: string;
  /** 생성 일시 */
  createdAt: Date;
  /** 수정 일시 */
  updatedAt: Date;
  /** 삭제 일시 (소프트 삭제) */
  deletedAt?: Date;

  // WbsItem 엔티티 필드들 (평가 시스템 전용)
  /** WBS 코드 */
  wbsCode: string;
  /** WBS 제목 */
  title: string;
  /** WBS 상태 */
  status: WbsItemStatus;
  /** 시작일 */
  startDate?: Date;
  /** 종료일 */
  endDate?: Date;
  /** 진행률 (%) */
  progressPercentage?: number;
  /** 담당자 ID */
  assignedToId?: string;
  /** 프로젝트 ID */
  projectId: string;
  /** 상위 WBS 항목 ID */
  parentWbsId?: string;
  /** WBS 레벨 (1: 최상위) */
  level: number;

  // 조인된 정보 필드들
  /** 담당자 이름 */
  assigneeName?: string;
  /** 프로젝트 이름 */
  projectName?: string;
  /** 상위 WBS 제목 */
  parentWbsTitle?: string;

  // 계산된 필드들 (읽기 전용)
  /** 삭제된 상태 여부 */
  readonly isDeleted: boolean;
  /** 진행 중 상태 여부 */
  readonly isInProgress: boolean;
  /** 완료된 상태 여부 */
  readonly isCompleted: boolean;
  /** 취소된 상태 여부 */
  readonly isCancelled: boolean;
  /** 대기 상태 여부 */
  readonly isPending: boolean;
  /** 지연 여부 */
  readonly isOverdue: boolean;
}

// WBS 항목 생성 DTO (평가 시스템 전용)
export interface CreateWbsItemDto {
  wbsCode: string;
  title: string;
  status: WbsItemStatus;
  startDate?: Date;
  endDate?: Date;
  progressPercentage?: number;
  assignedToId?: string;
  projectId: string;
  parentWbsId?: string;
  level: number;
}

// WBS 항목 업데이트 DTO (평가 시스템 전용)
export interface UpdateWbsItemDto {
  wbsCode?: string;
  title?: string;
  status?: WbsItemStatus;
  startDate?: Date;
  endDate?: Date;
  progressPercentage?: number;
  assignedToId?: string;
  projectId?: string;
  parentWbsId?: string;
  level?: number;
}

// WBS 항목 조회 필터 (평가 시스템 전용)
export interface WbsItemFilter {
  status?: WbsItemStatus;
  assignedToId?: string;
  projectId?: string;
  parentWbsId?: string;
  level?: number;
  startDateFrom?: Date;
  startDateTo?: Date;
  endDateFrom?: Date;
  endDateTo?: Date;
  progressMin?: number;
  progressMax?: number;
}

// WBS 항목 통계 (평가 시스템 전용)
export interface WbsItemStatistics {
  totalWbsItems: number;
  pendingWbsItems: number;
  inProgressWbsItems: number;
  completedWbsItems: number;
  cancelledWbsItems: number;
  onHoldWbsItems: number;
  wbsItemsByStatus: Record<string, number>;
  wbsItemsByProject: Record<string, number>;
  wbsItemsByAssignee: Record<string, number>;
  wbsItemsByLevel: Record<string, number>;
  averageProgressPercentage: number;
  lastSyncAt?: Date;
}

// WBS 항목 목록 조회 옵션
export interface WbsItemListOptions {
  page?: number;
  limit?: number;
  sortBy?:
    | 'wbsCode'
    | 'title'
    | 'startDate'
    | 'endDate'
    | 'progressPercentage'
    | 'createdAt';
  sortOrder?: 'ASC' | 'DESC';
  filter?: WbsItemFilter;
}

// WBS 계층 구조 트리 노드
export interface WbsTreeNode {
  wbsItem: WbsItemDto;
  children: WbsTreeNode[];
  depth: number;
  hasChildren: boolean;
  isExpanded?: boolean;
}
