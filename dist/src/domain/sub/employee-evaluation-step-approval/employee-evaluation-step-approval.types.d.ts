export declare enum StepApprovalStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REVISION_REQUESTED = "revision_requested",
    REVISION_COMPLETED = "revision_completed"
}
export type StepType = 'criteria' | 'self' | 'primary' | 'secondary';
export interface CreateEmployeeEvaluationStepApprovalData {
    evaluationPeriodEmployeeMappingId: string;
    createdBy: string;
}
export interface EmployeeEvaluationStepApprovalDto {
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
    createdBy: string;
    updatedBy: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
}
