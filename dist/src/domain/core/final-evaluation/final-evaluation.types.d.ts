export declare enum JobGrade {
    T1 = "T1",
    T2 = "T2",
    T3 = "T3"
}
export declare enum JobDetailedGrade {
    U = "u",
    N = "n",
    A = "a"
}
export interface CreateFinalEvaluationData {
    employeeId: string;
    periodId: string;
    evaluationGrade: string;
    jobGrade: JobGrade;
    jobDetailedGrade: JobDetailedGrade;
    finalComments?: string;
    createdBy: string;
}
export interface UpdateFinalEvaluationData {
    evaluationGrade?: string;
    jobGrade?: JobGrade;
    jobDetailedGrade?: JobDetailedGrade;
    finalComments?: string;
}
export interface FinalEvaluationDto {
    id: string;
    employeeId: string;
    periodId: string;
    evaluationGrade: string;
    jobGrade: JobGrade;
    jobDetailedGrade: JobDetailedGrade;
    finalComments?: string;
    isConfirmed: boolean;
    confirmedAt?: Date | null;
    confirmedBy?: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    createdBy?: string;
    updatedBy?: string;
    version: number;
}
export interface FinalEvaluationDetailDto extends FinalEvaluationDto {
    employee?: {
        id: string;
        name: string;
        position: string;
        department: string;
    };
    period?: {
        id: string;
        name: string;
        startDate: Date;
        endDate: Date;
    };
    confirmer?: {
        id: string;
        name: string;
    };
    approver?: {
        id: string;
        name: string;
    };
}
export interface FinalEvaluationFilter {
    employeeId?: string;
    periodId?: string;
    evaluationGrade?: string;
    jobGrade?: JobGrade;
    jobDetailedGrade?: JobDetailedGrade;
    confirmedOnly?: boolean;
    confirmedDateFrom?: Date;
    confirmedDateTo?: Date;
    page?: number;
    limit?: number;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
}
export interface FinalEvaluationStatistics {
    totalEvaluations: number;
    gradeDistribution: Record<string, number>;
    jobGradeDistribution: Record<JobGrade, number>;
    confirmedEvaluations: number;
}
