import type {
  StepType,
  StepApprovalStatus,
} from '@domain/sub/employee-evaluation-step-approval';

/**
 * 단계 승인 상태 변경 요청 데이터
 */
export interface UpdateStepApprovalRequest {
  /** 평가기간 ID */
  evaluationPeriodId: string;
  /** 직원 ID */
  employeeId: string;
  /** 단계 */
  step: StepType;
  /** 상태 */
  status: StepApprovalStatus;
  /** 재작성 요청 코멘트 (status가 revision_requested인 경우 필수) */
  revisionComment?: string;
  /** 변경자 ID */
  updatedBy: string;
}

/**
 * 단계별 승인 상태 변경 요청 데이터 (단계별 메서드용)
 */
export interface UpdateStepApprovalByStepRequest {
  /** 평가기간 ID */
  evaluationPeriodId: string;
  /** 직원 ID */
  employeeId: string;
  /** 상태 */
  status: StepApprovalStatus;
  /** 재작성 요청 코멘트 (status가 revision_requested인 경우 필수) */
  revisionComment?: string;
  /** 변경자 ID */
  updatedBy: string;
}

/**
 * 2차 평가 단계 승인 상태 변경 요청 데이터 (평가자별)
 */
export interface UpdateSecondaryStepApprovalRequest {
  /** 평가기간 ID */
  evaluationPeriodId: string;
  /** 직원 ID */
  employeeId: string;
  /** 평가자 ID */
  evaluatorId: string;
  /** 상태 */
  status: StepApprovalStatus;
  /** 재작성 요청 코멘트 (status가 revision_requested인 경우 필수) */
  revisionComment?: string;
  /** 변경자 ID */
  updatedBy: string;
}

/**
 * 단계 승인 컨텍스트 인터페이스
 */
export interface IStepApprovalContext {
  /**
   * 단계별 확인 상태를 변경한다 (기존 메서드, Deprecated)
   * @deprecated 단계별 메서드를 사용하세요
   */
  단계별_확인상태를_변경한다(request: UpdateStepApprovalRequest): Promise<void>;

  /**
   * 평가기준 설정 단계 승인 상태를 변경한다
   */
  평가기준설정_확인상태를_변경한다(
    request: UpdateStepApprovalByStepRequest,
  ): Promise<void>;

  /**
   * 자기평가 단계 승인 상태를 변경한다
   */
  자기평가_확인상태를_변경한다(
    request: UpdateStepApprovalByStepRequest,
  ): Promise<void>;

  /**
   * 1차 하향평가 단계 승인 상태를 변경한다
   */
  일차하향평가_확인상태를_변경한다(
    request: UpdateStepApprovalByStepRequest,
  ): Promise<void>;

  /**
   * 2차 하향평가 단계 승인 상태를 평가자별로 변경한다
   */
  이차하향평가_확인상태를_변경한다(
    request: UpdateSecondaryStepApprovalRequest,
  ): Promise<import('@domain/sub/secondary-evaluation-step-approval').SecondaryEvaluationStepApproval>;
}


