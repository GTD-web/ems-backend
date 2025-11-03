import type {
  StepApprovalStatus,
  EmployeeEvaluationStepApprovalDto,
} from '../employee-evaluation-step-approval.types';

/**
 * 직원 평가 단계 승인 인터페이스
 */
export interface IEmployeeEvaluationStepApproval {
  id: string;
  evaluationPeriodEmployeeMappingId: string;

  criteriaSettingStatus: StepApprovalStatus;
  criteriaSettingApprovedBy: string | null;
  criteriaSettingApprovedAt: Date | null;

  selfEvaluationStatus: StepApprovalStatus;
  selfEvaluationApprovedBy: string | null;
  selfEvaluationApprovedAt: Date | null;

  primaryEvaluationStatus: StepApprovalStatus;
  primaryEvaluationApprovedBy: string | null;
  primaryEvaluationApprovedAt: Date | null;

  secondaryEvaluationStatus: StepApprovalStatus;
  secondaryEvaluationApprovedBy: string | null;
  secondaryEvaluationApprovedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;

  // 메서드
  평가기준설정_확인한다(approvedBy: string): void;
  평가기준설정_대기로_변경한다(updatedBy: string): void;
  평가기준설정_재작성요청상태로_변경한다(updatedBy: string): void;

  자기평가_확인한다(approvedBy: string): void;
  자기평가_대기로_변경한다(updatedBy: string): void;
  자기평가_재작성요청상태로_변경한다(updatedBy: string): void;

  일차평가_확인한다(approvedBy: string): void;
  일차평가_대기로_변경한다(updatedBy: string): void;
  일차평가_재작성요청상태로_변경한다(updatedBy: string): void;

  이차평가_확인한다(approvedBy: string): void;
  이차평가_대기로_변경한다(updatedBy: string): void;
  이차평가_재작성요청상태로_변경한다(updatedBy: string): void;

  DTO로_변환한다(): EmployeeEvaluationStepApprovalDto;
}

