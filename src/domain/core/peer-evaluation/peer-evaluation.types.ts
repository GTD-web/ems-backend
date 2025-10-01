/**
 * 동료 평가 상태
 */
export enum PeerEvaluationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

/**
 * 동료평가 생성 데이터
 */
export interface CreatePeerEvaluationData {
  /** 동료평가 내용 */
  evaluationContent?: string;
  /** 동료평가 점수 */
  score?: number;
  /** 평가 상태 */
  status?: PeerEvaluationStatus;
  /** 평가일 */
  evaluationDate?: Date;
  /** 평가 완료 여부 */
  isCompleted?: boolean;
  /** 생성자 ID */
  createdBy: string;
}

/**
 * 동료평가 수정 데이터
 */
export interface UpdatePeerEvaluationData {
  /** 동료평가 내용 */
  evaluationContent?: string;
  /** 동료평가 점수 */
  score?: number;
  /** 평가 상태 */
  status?: PeerEvaluationStatus;
  /** 평가 완료 여부 */
  isCompleted?: boolean;
}

/**
 * 동료평가 DTO
 */
export interface PeerEvaluationDto {
  /** 동료평가 고유 식별자 */
  id: string;
  /** 동료평가 내용 */
  evaluationContent?: string;
  /** 동료평가 점수 */
  score?: number;
  /** 평가일 */
  evaluationDate: Date;
  /** 평가 상태 */
  status: PeerEvaluationStatus;
  /** 평가 완료 여부 */
  isCompleted: boolean;
  /** 평가 완료일 */
  completedAt?: Date;
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
  /** 점수 범위 필터 - 최소 */
  scoreFrom?: number;
  /** 점수 범위 필터 - 최대 */
  scoreTo?: number;
  /** 평가일 범위 - 시작 */
  evaluationDateFrom?: Date;
  /** 평가일 범위 - 종료 */
  evaluationDateTo?: Date;
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
  /** 평균 점수 */
  averageScore: number;
  /** 최고 점수 */
  maxScore: number;
  /** 최저 점수 */
  minScore: number;
}
