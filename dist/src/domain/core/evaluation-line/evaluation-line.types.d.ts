export declare enum EvaluatorType {
    PRIMARY = "primary",
    SECONDARY = "secondary",
    ADDITIONAL = "additional"
}
export interface CreateEvaluationLineDto {
    evaluatorType: EvaluatorType;
    order: number;
    isRequired?: boolean;
    isAutoAssigned?: boolean;
}
export interface UpdateEvaluationLineDto {
    evaluatorType?: EvaluatorType;
    order?: number;
    isRequired?: boolean;
    isAutoAssigned?: boolean;
}
export interface EvaluationLineDto {
    id: string;
    evaluatorType: EvaluatorType;
    order: number;
    isRequired: boolean;
    isAutoAssigned: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface EvaluationLineFilter {
    evaluatorType?: EvaluatorType;
    requiredOnly?: boolean;
    autoAssignedOnly?: boolean;
    orderFrom?: number;
    orderTo?: number;
}
