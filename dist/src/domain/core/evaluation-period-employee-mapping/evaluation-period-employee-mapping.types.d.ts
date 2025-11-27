export interface CreateEvaluationPeriodEmployeeMappingData {
    evaluationPeriodId: string;
    employeeId: string;
    createdBy: string;
}
export interface EvaluationPeriodEmployeeMappingDto {
    id: string;
    evaluationPeriodId: string;
    employeeId: string;
    isExcluded: boolean;
    excludeReason?: string | null;
    excludedBy?: string | null;
    excludedAt?: Date | null;
    isCriteriaSubmitted: boolean;
    criteriaSubmittedAt?: Date | null;
    criteriaSubmittedBy?: string | null;
    isNewEnrolled: boolean;
    createdBy: string;
    updatedBy: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
}
export interface EvaluationTargetSummaryDto {
    mappingId: string;
    evaluationPeriodId: string;
    employeeId: string;
    employeeNumber: string;
    employeeName: string;
    email: string;
    departmentName?: string;
    rankName?: string;
    isExcluded: boolean;
    excludeReason?: string | null;
    excludedAt?: Date | null;
}
export interface EvaluationPeriodTargetStatisticsDto {
    evaluationPeriodId: string;
    totalTargets: number;
    activeTargets: number;
    excludedTargets: number;
    excludeRate: number;
}
