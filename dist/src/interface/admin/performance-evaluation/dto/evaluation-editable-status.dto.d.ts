export declare class UpdatePeriodAllEvaluationEditableStatusDto {
    isSelfEvaluationEditable: boolean;
    isPrimaryEvaluationEditable: boolean;
    isSecondaryEvaluationEditable: boolean;
    updatedBy?: string;
}
export declare class PeriodAllEvaluationEditableStatusResponseDto {
    updatedCount: number;
    evaluationPeriodId: string;
    isSelfEvaluationEditable: boolean;
    isPrimaryEvaluationEditable: boolean;
    isSecondaryEvaluationEditable: boolean;
}
