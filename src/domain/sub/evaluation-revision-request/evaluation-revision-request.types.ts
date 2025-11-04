/**
 * 재작성 요청 단계 타입
 */
export type RevisionRequestStepType = 'criteria' | 'self' | 'primary' | 'secondary';

/**
 * 수신자 타입
 */
export type RecipientType = 'evaluatee' | 'primary_evaluator' | 'secondary_evaluator';

/**
 * 재작성 요청 생성 데이터
 */
export interface CreateRevisionRequestData {
  /** 평가기간 ID */
  evaluationPeriodId: string;
  /** 피평가자 ID */
  employeeId: string;
  /** 재작성 요청 단계 */
  step: RevisionRequestStepType;
  /** 재작성 요청 코멘트 */
  comment: string;
  /** 요청자 ID (관리자) */
  requestedBy: string;
  /** 수신자 목록 */
  recipients: Array<{ recipientId: string; recipientType: RecipientType }>;
  /** 생성자 ID */
  createdBy: string;
}

/**
 * 재작성 요청 DTO
 */
export interface EvaluationRevisionRequestDto {
  /** 재작성 요청 ID */
  id: string;
  /** 평가기간 ID */
  evaluationPeriodId: string;
  /** 피평가자 ID */
  employeeId: string;
  /** 재작성 요청 단계 */
  step: RevisionRequestStepType;
  /** 재작성 요청 코멘트 */
  comment: string;
  /** 요청자 ID */
  requestedBy: string;
  /** 요청 일시 */
  requestedAt: Date;
  /** 생성 일시 */
  createdAt: Date;
  /** 수정 일시 */
  updatedAt: Date;
  /** 삭제 일시 */
  deletedAt?: Date | null;
}

/**
 * 재작성 요청 수신자 생성 데이터
 */
export interface CreateRecipientData {
  /** 재작성 요청 ID */
  revisionRequestId: string;
  /** 수신자 ID */
  recipientId: string;
  /** 수신자 타입 */
  recipientType: RecipientType;
  /** 생성자 ID */
  createdBy: string;
}

/**
 * 재작성 요청 수신자 DTO
 */
export interface EvaluationRevisionRequestRecipientDto {
  /** 수신자 ID */
  id: string;
  /** 재작성 요청 ID */
  revisionRequestId: string;
  /** 수신자 ID */
  recipientId: string;
  /** 수신자 타입 */
  recipientType: RecipientType;
  /** 읽음 여부 */
  isRead: boolean;
  /** 읽은 일시 */
  readAt: Date | null;
  /** 재작성 완료 여부 */
  isCompleted: boolean;
  /** 재작성 완료 일시 */
  completedAt: Date | null;
  /** 재작성 완료 응답 코멘트 */
  responseComment: string | null;
  /** 생성 일시 */
  createdAt: Date;
  /** 수정 일시 */
  updatedAt: Date;
  /** 삭제 일시 */
  deletedAt?: Date | null;
}

/**
 * 재작성 요청 필터
 */
export interface RevisionRequestFilter {
  /** 평가기간 ID */
  evaluationPeriodId?: string;
  /** 피평가자 ID */
  employeeId?: string;
  /** 단계 */
  step?: RevisionRequestStepType;
  /** 요청자 ID */
  requestedBy?: string;
}

/**
 * 재작성 요청 수신자 필터
 */
export interface RevisionRequestRecipientFilter {
  /** 수신자 ID */
  recipientId?: string;
  /** 읽음 여부 */
  isRead?: boolean;
  /** 재작성 완료 여부 */
  isCompleted?: boolean;
  /** 평가기간 ID (join 필요) */
  evaluationPeriodId?: string;
  /** 단계 (join 필요) */
  step?: RevisionRequestStepType;
}


