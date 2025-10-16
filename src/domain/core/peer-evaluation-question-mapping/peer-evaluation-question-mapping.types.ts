/**
 * 동료평가 질문 매핑 생성 DTO
 */
export interface CreatePeerEvaluationQuestionMappingDto {
  /** 동료평가 ID */
  peerEvaluationId: string;
  /** 평가 질문 ID */
  questionId: string;
  /** 질문 그룹 ID (그룹 단위 추가 시 사용) */
  questionGroupId?: string;
  /** 표시 순서 */
  displayOrder: number;
}

/**
 * 동료평가 질문 매핑 수정 DTO
 */
export interface UpdatePeerEvaluationQuestionMappingDto {
  /** 표시 순서 */
  displayOrder?: number;
}

/**
 * 동료평가 질문 매핑 DTO
 */
export interface PeerEvaluationQuestionMappingDto {
  /** 매핑 ID */
  id: string;
  /** 동료평가 ID */
  peerEvaluationId: string;
  /** 평가 질문 ID */
  questionId: string;
  /** 질문 그룹 ID (그룹 단위 추가 시 사용) */
  questionGroupId?: string;
  /** 표시 순서 */
  displayOrder: number;
  /** 생성일시 */
  createdAt: Date;
  /** 수정일시 */
  updatedAt: Date;
}

/**
 * 동료평가 질문 매핑 필터
 */
export interface PeerEvaluationQuestionMappingFilter {
  /** 동료평가 ID */
  peerEvaluationId?: string;
  /** 평가 질문 ID */
  questionId?: string;
  /** 질문 그룹 ID */
  questionGroupId?: string;
}
