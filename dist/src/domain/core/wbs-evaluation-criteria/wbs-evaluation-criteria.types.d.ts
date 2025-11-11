export interface CreateWbsEvaluationCriteriaData {
    wbsItemId: string;
    criteria: string;
    importance: number;
}
export interface UpdateWbsEvaluationCriteriaData {
    criteria?: string;
    importance?: number;
}
export interface WbsEvaluationCriteriaDto {
    id: string;
    wbsItemId: string;
    criteria: string;
    importance: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface WbsEvaluationCriteriaFilter {
    wbsItemId?: string;
    criteriaSearch?: string;
    criteriaExact?: string;
}
