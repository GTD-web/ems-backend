import { StepApprovalStatus } from '../employee-evaluation-step-approval/employee-evaluation-step-approval.types';
export { StepApprovalStatus };
export interface CreateSecondaryEvaluationStepApprovalData {
    evaluationPeriodEmployeeMappingId: string;
    evaluatorId: string;
    status?: StepApprovalStatus;
    approvedBy?: string | null;
    approvedAt?: Date | null;
    revisionRequestId?: string | null;
    createdBy: string;
}
export interface SecondaryEvaluationStepApprovalDto {
    id: string;
    evaluationPeriodEmployeeMappingId: string;
    evaluatorId: string;
    status: StepApprovalStatus;
    approvedBy: string | null;
    approvedAt: Date | null;
    revisionRequestId: string | null;
    createdBy: string;
    updatedBy: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
}
