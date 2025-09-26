/**
 * 동료평가 맵핑 관련 타입 정의
 */

/**
 * 동료평가 맵핑 DTO
 */
export interface PeerEvaluationMappingDto {
  /** 고유 식별자 (UUID) */
  id: string;
  /** 피평가자 ID - 평가를 받는 직원 식별자 */
  employeeId: string;
  /** 평가자 ID - 평가를 수행하는 직원 식별자 */
  evaluatorId: string;
  /** 평가 기간 ID - 평가가 수행되는 평가 기간 */
  periodId: string;
  /** 동료평가 ID - 실제 동료평가 엔티티 식별자 */
  peerEvaluationId: string;
  /** 생성 일시 */
  createdAt: Date;
  /** 수정 일시 */
  updatedAt: Date;
}

/**
 * 동료평가 맵핑 생성 데이터
 */
export interface CreatePeerEvaluationMappingData {
  employeeId: string;
  evaluatorId: string;
  periodId: string;
  peerEvaluationId: string;
}

/**
 * 동료평가 맵핑 업데이트 데이터
 */
export interface UpdatePeerEvaluationMappingData {
  peerEvaluationId?: string;
}

/**
 * 동료평가 맵핑 필터
 */
export interface PeerEvaluationMappingFilter {
  employeeId?: string;
  evaluatorId?: string;
  periodId?: string;
  peerEvaluationId?: string;
  /** 자기평가 맵핑만 조회 */
  selfEvaluationOnly?: boolean;
}
