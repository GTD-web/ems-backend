/**
 * 동료 평가 상태
 */
export enum PeerEvaluationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * 동료평가 생성 데이터
 */
export interface CreatePeerEvaluationData {
  /** 피평가자 ID */
  employeeId: string;
  /** 평가자 ID */
  evaluatorId: string;
  /** 평가 기간 ID */
  periodId: string;
  /** 평가 상태 */
  status?: PeerEvaluationStatus;
  /** 평가일 */
  evaluationDate?: Date;
  /** 평가 완료 여부 */
  isCompleted?: boolean;
  /** 매핑일 */
  mappedDate?: Date;
  /** 매핑자 ID */
  mappedBy?: string;
  /** 활성 상태 */
  isActive?: boolean;
  /** 생성자 ID */
  createdBy: string;
}

/**
 * 동료평가 수정 데이터
 */
export interface UpdatePeerEvaluationData {
  /** 평가 상태 */
  status?: PeerEvaluationStatus;
  /** 평가 완료 여부 */
  isCompleted?: boolean;
  /** 활성 상태 */
  isActive?: boolean;
}

/**
 * 동료평가 DTO
 */
export interface PeerEvaluationDto {
  /** 동료평가 고유 식별자 */
  id: string;
  /** 피평가자 ID */
  employeeId: string;
  /** 평가자 ID */
  evaluatorId: string;
  /** 평가 기간 ID */
  periodId: string;
  /** 평가일 */
  evaluationDate: Date;
  /** 평가 상태 */
  status: PeerEvaluationStatus;
  /** 평가 완료 여부 */
  isCompleted: boolean;
  /** 평가 완료일 */
  completedAt?: Date;
  /** 매핑일 */
  mappedDate: Date;
  /** 매핑자 ID */
  mappedBy: string;
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
 * 동료평가 필터
 */
export interface PeerEvaluationFilter {
  /** 피평가자 ID */
  employeeId?: string;
  /** 평가자 ID */
  evaluatorId?: string;
  /** 평가 기간 ID */
  periodId?: string;
  /** 매핑자 ID */
  mappedBy?: string;
  /** 평가 상태 */
  status?: PeerEvaluationStatus;
  /** 완료된 평가만 조회 */
  completedOnly?: boolean;
  /** 미완료 평가만 조회 */
  uncompletedOnly?: boolean;
  /** 대기중인 평가만 조회 */
  pendingOnly?: boolean;
  /** 진행중인 평가만 조회 */
  inProgressOnly?: boolean;
  /** 활성 평가만 조회 */
  activeOnly?: boolean;
  /** 비활성 평가만 조회 */
  inactiveOnly?: boolean;
  /** 평가일 범위 - 시작 */
  evaluationDateFrom?: Date;
  /** 평가일 범위 - 종료 */
  evaluationDateTo?: Date;
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
 * 동료 평가 통계
 */
export interface PeerEvaluationStatistics {
  /** 전체 동료 평가 수 */
  totalEvaluations: number;
  /** 상태별 통계 */
  statusCounts: Record<PeerEvaluationStatus, number>;
  /** 완료된 평가 수 */
  completedEvaluations: number;
}
