export interface EvaluationLineMappingDto {
    id: string;
    evaluationPeriodId: string;
    employeeId: string;
    evaluatorId: string;
    wbsItemId?: string;
    evaluationLineId: string;
    createdBy?: string;
    updatedBy?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateEvaluationLineMappingData {
    evaluationPeriodId: string;
    employeeId: string;
    evaluatorId: string;
    wbsItemId?: string;
    evaluationLineId: string;
    createdBy: string;
}
export interface UpdateEvaluationLineMappingData {
    evaluatorId?: string;
    evaluationLineId?: string;
    wbsItemId?: string;
    updatedBy?: string;
}
export interface EvaluationLineMappingFilter {
    evaluationPeriodId?: string;
    employeeId?: string;
    evaluatorId?: string;
    wbsItemId?: string;
    evaluationLineId?: string;
    createdBy?: string;
    updatedBy?: string;
    withWbsItem?: boolean;
}
