import { StepApprovalStatus } from '../employee-evaluation-step-approval/employee-evaluation-step-approval.types';

// Re-export for convenience
export { StepApprovalStatus };

/**
 * 2차 평가자별 단계 승인 생성 데이터
 */
export interface CreateSecondaryEvaluationStepApprovalData {
  /** 평가기간-직원 맵핑 ID */
  evaluationPeriodEmployeeMappingId: string;
  /** 평가자 ID */
  evaluatorId: string;
  /** 승인 상태 (기본값: pending) */
  status?: StepApprovalStatus;
  /** 승인자 ID */
  approvedBy?: string | null;
  /** 승인 일시 */
  approvedAt?: Date | null;
  /** 재작성 요청 ID */
  revisionRequestId?: string | null;
  /** 생성자 ID */
  createdBy: string;
}

/**
 * 2차 평가자별 단계 승인 DTO
 */
export interface SecondaryEvaluationStepApprovalDto {
  /** 2차 평가자별 단계 승인 ID */
  id: string;
  /** 평가기간-직원 맵핑 ID */
  evaluationPeriodEmployeeMappingId: string;
  /** 평가자 ID */
  evaluatorId: string;
  /** 승인 상태 */
  status: StepApprovalStatus;
  /** 승인자 ID */
  approvedBy: string | null;
  /** 승인 일시 */
  approvedAt: Date | null;
  /** 재작성 요청 ID */
  revisionRequestId: string | null;
  /** 생성자 ID */
  createdBy: string;
  /** 수정자 ID */
  updatedBy: string;
  /** 생성 일시 */
  createdAt: Date;
  /** 수정 일시 */
  updatedAt: Date;
  /** 삭제 일시 */
  deletedAt?: Date | null;
}
