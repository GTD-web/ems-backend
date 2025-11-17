import type {
  StepApprovalStatus,
  SecondaryEvaluationStepApprovalDto,
} from '../secondary-evaluation-step-approval.types';

/**
 * 2차 평가자별 단계 승인 인터페이스
 */
export interface ISecondaryEvaluationStepApproval {
  id: string;
  evaluationPeriodEmployeeMappingId: string;
  evaluatorId: string;
  status: StepApprovalStatus;
  approvedBy: string | null;
  approvedAt: Date | null;
  revisionRequestId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;

  // 메서드
  승인한다(approvedBy: string): void;
  대기로_변경한다(updatedBy: string): void;
  재작성요청상태로_변경한다(updatedBy: string, revisionRequestId: string): void;
  재작성완료상태로_변경한다(updatedBy: string): void;
  DTO로_변환한다(): SecondaryEvaluationStepApprovalDto;
}

