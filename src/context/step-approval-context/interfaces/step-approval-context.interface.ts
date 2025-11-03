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
 * 단계 승인 컨텍스트 인터페이스
 */
export interface IStepApprovalContext {
  /**
   * 단계별 확인 상태를 변경한다
   */
  단계별_확인상태를_변경한다(request: UpdateStepApprovalRequest): Promise<void>;
}
