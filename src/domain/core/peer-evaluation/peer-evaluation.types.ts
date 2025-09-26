/**
 * 동료 평가 상태
 */
export enum PeerEvaluationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

/**
 * 동료 평가 생성 DTO
 * 실제 동료평가 데이터만 포함합니다.
 */
export interface CreatePeerEvaluationDto {
  /** 평가 내용 */
  evaluationContent?: string;
  /** 평가 점수 */
  score?: number;
}

/**
 * 동료 평가 업데이트 DTO
 */
export interface UpdatePeerEvaluationDto {
  /** 평가 내용 */
  evaluationContent?: string;
  /** 평가 점수 */
  score?: number;
  /** 평가 상태 */
  status?: PeerEvaluationStatus;
}

/**
 * 동료 평가 DTO
 * 실제 동료평가 데이터만 포함합니다.
 */
export interface PeerEvaluationDto {
  /** 동료 평가 고유 식별자 */
  id: string;
  /** 평가 내용 */
  evaluationContent?: string;
  /** 평가 점수 */
  score?: number;
  /** 평가일 */
  evaluationDate: Date;
  /** 평가 상태 */
  status: PeerEvaluationStatus;
  /** 생성일시 */
  createdAt: Date;
  /** 수정일시 */
  updatedAt: Date;
}

/**
 * 동료 평가 필터
 * 실제 동료평가 데이터 기준 필터입니다.
 */
export interface PeerEvaluationFilter {
  /** 평가 상태 */
  status?: PeerEvaluationStatus;
  /** 완료된 평가만 조회 */
  completedOnly?: boolean;
  /** 대기중인 평가만 조회 */
  pendingOnly?: boolean;
  /** 점수 범위 필터 - 최소 */
  scoreFrom?: number;
  /** 점수 범위 필터 - 최대 */
  scoreTo?: number;
  /** 평가일 범위 - 시작 */
  evaluationDateFrom?: Date;
  /** 평가일 범위 - 종료 */
  evaluationDateTo?: Date;
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
