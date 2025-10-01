/**
 * 동료평가 맵핑 관련 타입 정의
 */

/**
 * 동료평가 매핑 DTO
 */
export interface PeerEvaluationMappingDto {
  /** 고유 식별자 (UUID) */
  id: string;
  /** 피평가자 ID */
  employeeId: string;
  /** 평가자 ID */
  evaluatorId: string;
  /** 평가 기간 ID */
  periodId: string;
  /** 동료평가 ID */
  peerEvaluationId: string;
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
}

/**
 * 동료평가 매핑 생성 데이터
 */
export interface CreatePeerEvaluationMappingData {
  /** 피평가자 ID */
  employeeId: string;
  /** 평가자 ID */
  evaluatorId: string;
  /** 평가 기간 ID */
  periodId: string;
  /** 동료평가 ID */
  peerEvaluationId: string;
  /** 매핑자 ID */
  mappedBy: string;
}

/**
 * 동료평가 매핑 수정 데이터
 */
export interface UpdatePeerEvaluationMappingData {
  /** 동료평가 ID */
  peerEvaluationId?: string;
  /** 활성 상태 */
  isActive?: boolean;
}

/**
 * 동료평가 매핑 필터
 */
export interface PeerEvaluationMappingFilter {
  /** 피평가자 ID */
  employeeId?: string;
  /** 평가자 ID */
  evaluatorId?: string;
  /** 평가 기간 ID */
  periodId?: string;
  /** 동료평가 ID */
  peerEvaluationId?: string;
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
