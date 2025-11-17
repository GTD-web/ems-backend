export declare enum StepTypeEnum {
    CRITERIA = "criteria",
    SELF = "self",
    PRIMARY = "primary",
    SECONDARY = "secondary"
}
export declare enum StepApprovalStatusEnum {
    PENDING = "pending",
    APPROVED = "approved",
    REVISION_REQUESTED = "revision_requested",
    REVISION_COMPLETED = "revision_completed"
}
export declare class UpdateStepApprovalDto {
    status: StepApprovalStatusEnum;
    revisionComment?: string;
    approveSubsequentSteps?: boolean;
}
