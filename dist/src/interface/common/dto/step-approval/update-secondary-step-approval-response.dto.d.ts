import { StepApprovalStatusEnum } from './update-step-approval.dto';
export declare class UpdateSecondaryStepApprovalResponseDto {
    id: string;
    evaluationPeriodEmployeeMappingId: string;
    evaluatorId: string;
    status: StepApprovalStatusEnum;
    approvedBy: string | null;
    approvedAt: Date | null;
    revisionRequestId: string | null;
    createdAt: Date;
    updatedAt: Date;
}
