/**
 * 단계 승인 상태
 */
export enum StepApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REVISION_REQUESTED = 'revision_requested',
  REVISION_COMPLETED = 'revision_completed',
}

/**
 * 평가 단계 타입
 */
export type StepType = 'criteria' | 'self' | 'primary' | 'secondary';

/**
 * 직원 평가 단계 승인 생성 데이터
 */
export interface CreateEmployeeEvaluationStepApprovalData {
  /** 평가기간-직원 맵핑 ID */
  evaluationPeriodEmployeeMappingId: string;
  /** 생성자 ID */
  createdBy: string;
}

/**
 * 직원 평가 단계 승인 DTO
 */
export interface EmployeeEvaluationStepApprovalDto {
  /** 단계 승인 ID */
  id: string;
  /** 평가기간-직원 맵핑 ID */
  evaluationPeriodEmployeeMappingId: string;

  /** 평가기준 설정 상태 */
  criteriaSettingStatus: StepApprovalStatus;
  /** 평가기준 설정 승인자 ID */
  criteriaSettingApprovedBy: string | null;
  /** 평가기준 설정 승인 일시 */
  criteriaSettingApprovedAt: Date | null;

  /** 자기평가 상태 */
  selfEvaluationStatus: StepApprovalStatus;
  /** 자기평가 승인자 ID */
  selfEvaluationApprovedBy: string | null;
  /** 자기평가 승인 일시 */
  selfEvaluationApprovedAt: Date | null;

  /** 1차 하향평가 상태 */
  primaryEvaluationStatus: StepApprovalStatus;
  /** 1차 하향평가 승인자 ID */
  primaryEvaluationApprovedBy: string | null;
  /** 1차 하향평가 승인 일시 */
  primaryEvaluationApprovedAt: Date | null;

  /** 2차 하향평가 상태 */
  secondaryEvaluationStatus: StepApprovalStatus;
  /** 2차 하향평가 승인자 ID */
  secondaryEvaluationApprovedBy: string | null;
  /** 2차 하향평가 승인 일시 */
  secondaryEvaluationApprovedAt: Date | null;

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


