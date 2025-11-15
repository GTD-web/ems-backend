import { JobDetailedGrade, JobGrade } from '@domain/core/final-evaluation/final-evaluation.types';
export declare class UpsertFinalEvaluationBodyDto {
    evaluationGrade: string;
    jobGrade: JobGrade;
    jobDetailedGrade: JobDetailedGrade;
    finalComments?: string;
}
export declare class UpdateFinalEvaluationBodyDto {
    evaluationGrade?: string;
    jobGrade?: JobGrade;
    jobDetailedGrade?: JobDetailedGrade;
    finalComments?: string;
    updatedBy?: string;
}
export declare class ConfirmFinalEvaluationBodyDto {
}
export declare class CancelConfirmationBodyDto {
}
export declare class FinalEvaluationFilterDto {
    employeeId?: string;
    periodId?: string;
    evaluationGrade?: string;
    jobGrade?: JobGrade;
    jobDetailedGrade?: JobDetailedGrade;
    confirmedOnly?: boolean;
    page?: number;
    limit?: number;
}
export declare class FinalEvaluationResponseDto {
    id: string;
    message: string;
}
export declare class FinalEvaluationBasicDto {
    id: string;
    employeeId: string;
    periodId: string;
    evaluationGrade: string;
    jobGrade: JobGrade;
    jobDetailedGrade: JobDetailedGrade;
    finalComments?: string;
    isConfirmed: boolean;
    confirmedAt?: Date;
    confirmedBy?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class EmployeeBasicInfoDto {
    id: string;
    name: string;
    employeeNumber: string;
    email?: string;
}
export declare class PeriodBasicInfoDto {
    id: string;
    name: string;
    startDate: Date;
    status: string;
}
export declare class FinalEvaluationDetailDto {
    id: string;
    employee: EmployeeBasicInfoDto;
    period: PeriodBasicInfoDto;
    evaluationGrade: string;
    jobGrade: JobGrade;
    jobDetailedGrade: JobDetailedGrade;
    finalComments?: string;
    isConfirmed: boolean;
    confirmedAt?: Date | null;
    confirmedBy?: string | null;
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
    updatedBy?: string;
    version: number;
}
export declare class FinalEvaluationListItemDto {
    id: string;
    employee: EmployeeBasicInfoDto;
    period: PeriodBasicInfoDto;
    evaluationGrade: string;
    jobGrade: JobGrade;
    jobDetailedGrade: JobDetailedGrade;
    finalComments?: string;
    isConfirmed: boolean;
    confirmedAt?: Date | null;
    confirmedBy?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export declare class FinalEvaluationListResponseDto {
    evaluations: FinalEvaluationListItemDto[];
    total: number;
    page: number;
    limit: number;
}
