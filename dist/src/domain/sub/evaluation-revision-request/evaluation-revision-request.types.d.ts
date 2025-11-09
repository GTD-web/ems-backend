export type RevisionRequestStepType = 'criteria' | 'self' | 'primary' | 'secondary';
export declare enum RecipientType {
    EVALUATEE = "evaluatee",
    PRIMARY_EVALUATOR = "primary_evaluator",
    SECONDARY_EVALUATOR = "secondary_evaluator"
}
export interface CreateRevisionRequestData {
    evaluationPeriodId: string;
    employeeId: string;
    step: RevisionRequestStepType;
    comment: string;
    requestedBy: string;
    recipients: Array<{
        recipientId: string;
        recipientType: RecipientType;
    }>;
    createdBy: string;
}
export interface EvaluationRevisionRequestDto {
    id: string;
    evaluationPeriodId: string;
    employeeId: string;
    step: RevisionRequestStepType;
    comment: string;
    requestedBy: string;
    requestedAt: Date;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
}
export interface CreateRecipientData {
    revisionRequestId: string;
    recipientId: string;
    recipientType: RecipientType;
    createdBy: string;
}
export interface EvaluationRevisionRequestRecipientDto {
    id: string;
    revisionRequestId: string;
    recipientId: string;
    recipientType: RecipientType;
    isRead: boolean;
    readAt: Date | null;
    isCompleted: boolean;
    completedAt: Date | null;
    responseComment: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
}
export interface RevisionRequestFilter {
    evaluationPeriodId?: string;
    employeeId?: string;
    step?: RevisionRequestStepType;
    requestedBy?: string;
}
export interface RevisionRequestRecipientFilter {
    recipientId?: string;
    isRead?: boolean;
    isCompleted?: boolean;
    evaluationPeriodId?: string;
    employeeId?: string;
    step?: RevisionRequestStepType;
}
