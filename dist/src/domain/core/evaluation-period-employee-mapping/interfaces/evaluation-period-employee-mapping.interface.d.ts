export interface IEvaluationPeriodEmployeeMapping {
    readonly id: string;
    readonly evaluationPeriodId: string;
    readonly employeeId: string;
    readonly isExcluded: boolean;
    readonly excludeReason?: string | null;
    readonly excludedBy?: string | null;
    readonly excludedAt?: Date | null;
    readonly createdBy?: string;
    readonly updatedBy?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt?: Date | null;
}
export interface CreateEvaluationPeriodEmployeeMappingData {
    evaluationPeriodId: string;
    employeeId: string;
    createdBy: string;
}
export interface UpdateEvaluationPeriodEmployeeMappingData {
    isExcluded?: boolean;
    excludeReason?: string | null;
    excludedBy?: string | null;
    excludedAt?: Date | null;
    updatedBy: string;
}
export interface ExcludeEvaluationTargetData {
    excludeReason: string;
    excludedBy: string;
}
export interface IncludeEvaluationTargetData {
    updatedBy: string;
}
export interface EvaluationPeriodEmployeeMappingFilter {
    evaluationPeriodId?: string;
    employeeId?: string;
    isExcluded?: boolean;
    includeExcluded?: boolean;
    excludedOnly?: boolean;
    excludedBy?: string;
    excludedAtFrom?: Date;
    excludedAtTo?: Date;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
    page?: number;
    limit?: number;
}
