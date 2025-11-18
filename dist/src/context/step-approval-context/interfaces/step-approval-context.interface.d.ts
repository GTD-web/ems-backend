import type { StepType, StepApprovalStatus } from '@domain/sub/employee-evaluation-step-approval';
export interface UpdateStepApprovalRequest {
    evaluationPeriodId: string;
    employeeId: string;
    step: StepType;
    status: StepApprovalStatus;
    revisionComment?: string;
    updatedBy: string;
}
export interface UpdateStepApprovalByStepRequest {
    evaluationPeriodId: string;
    employeeId: string;
    status: StepApprovalStatus;
    revisionComment?: string;
    updatedBy: string;
}
export interface UpdateSecondaryStepApprovalRequest {
    evaluationPeriodId: string;
    employeeId: string;
    evaluatorId: string;
    status: StepApprovalStatus;
    revisionComment?: string;
    updatedBy: string;
}
export interface IStepApprovalContext {
    단계별_확인상태를_변경한다(request: UpdateStepApprovalRequest): Promise<void>;
    평가기준설정_확인상태를_변경한다(request: UpdateStepApprovalByStepRequest): Promise<void>;
    자기평가_확인상태를_변경한다(request: UpdateStepApprovalByStepRequest): Promise<void>;
    일차하향평가_확인상태를_변경한다(request: UpdateStepApprovalByStepRequest): Promise<void>;
    이차하향평가_확인상태를_변경한다(request: UpdateSecondaryStepApprovalRequest): Promise<import('@domain/sub/secondary-evaluation-step-approval').SecondaryEvaluationStepApproval>;
}
