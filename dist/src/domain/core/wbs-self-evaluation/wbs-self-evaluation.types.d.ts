export interface WbsSelfEvaluationDto {
    id: string;
    periodId: string;
    employeeId: string;
    wbsItemId: string;
    assignedBy: string;
    assignedDate: Date;
    submittedToEvaluator: boolean;
    submittedToEvaluatorAt?: Date;
    submittedToManager: boolean;
    submittedToManagerAt?: Date;
    evaluationDate: Date;
    performanceResult?: string;
    selfEvaluationContent?: string;
    selfEvaluationScore?: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    createdBy?: string;
    updatedBy?: string;
    version: number;
}
export interface WbsSelfEvaluationDetailDto {
    id: string;
    periodId: string;
    employeeId: string;
    wbsItemId: string;
    assignedBy: string;
    assignedDate: Date;
    submittedToEvaluator: boolean;
    submittedToEvaluatorAt?: Date;
    submittedToManager: boolean;
    submittedToManagerAt?: Date;
    evaluationDate: Date;
    performanceResult?: string;
    selfEvaluationContent?: string;
    selfEvaluationScore?: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    createdBy?: string;
    updatedBy?: string;
    version: number;
}
export interface CreateWbsSelfEvaluationData {
    periodId: string;
    employeeId: string;
    wbsItemId: string;
    assignedBy: string;
    performanceResult?: string;
    selfEvaluationContent?: string;
    selfEvaluationScore?: number;
    createdBy: string;
}
export interface UpdateWbsSelfEvaluationData {
    assignedBy?: string;
    submittedToEvaluator?: boolean;
    submittedToManager?: boolean;
    resetSubmittedToManagerAt?: boolean;
    performanceResult?: string;
    selfEvaluationContent?: string;
    selfEvaluationScore?: number;
}
export interface WbsSelfEvaluationFilter {
    periodId?: string;
    employeeId?: string;
    wbsItemId?: string;
    assignedBy?: string;
    submittedToEvaluatorOnly?: boolean;
    notSubmittedToEvaluatorOnly?: boolean;
    submittedToManagerOnly?: boolean;
    notSubmittedToManagerOnly?: boolean;
    assignedDateFrom?: Date;
    assignedDateTo?: Date;
    submittedToEvaluatorDateFrom?: Date;
    submittedToEvaluatorDateTo?: Date;
    submittedToManagerDateFrom?: Date;
    submittedToManagerDateTo?: Date;
    evaluationDateFrom?: Date;
    evaluationDateTo?: Date;
    scoreFrom?: number;
    scoreTo?: number;
    page?: number;
    limit?: number;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
}
