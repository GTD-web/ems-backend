export declare class CreatePrimaryDownwardEvaluationBodyDto {
    evaluatorId: string;
    selfEvaluationId?: string;
    downwardEvaluationContent?: string;
    downwardEvaluationScore?: number;
}
export declare class CreateSecondaryDownwardEvaluationBodyDto {
    evaluatorId: string;
    selfEvaluationId?: string;
    downwardEvaluationContent?: string;
    downwardEvaluationScore?: number;
}
export declare class UpdateDownwardEvaluationDto {
    downwardEvaluationContent?: string;
    downwardEvaluationScore?: number;
}
export declare class SubmitDownwardEvaluationDto {
    evaluatorId: string;
}
export declare class SubmitDownwardEvaluationQueryDto {
    approveAllBelow?: boolean;
}
export declare class DownwardEvaluationFilterDto {
    evaluateeId?: string;
    periodId?: string;
    wbsId?: string;
    evaluationType?: string;
    isCompleted?: boolean;
    page?: number;
    limit?: number;
}
export declare class DownwardEvaluationBasicDto {
    id: string;
    employeeId: string;
    evaluatorId: string;
    wbsId: string;
    periodId: string;
    selfEvaluationId?: string;
    evaluationDate: Date;
    downwardEvaluationContent?: string;
    downwardEvaluationScore?: number;
    evaluationType: string;
    isCompleted: boolean;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    createdBy?: string;
    updatedBy?: string;
    version: number;
}
export declare class DownwardEvaluationResponseDto {
    id: string;
    evaluatorId: string;
    message: string;
}
export declare class ResetDownwardEvaluationResponseDto {
    message: string;
}
export declare class DownwardEvaluationListResponseDto {
    evaluations: DownwardEvaluationBasicDto[];
    total: number;
    page: number;
    limit: number;
}
export declare class DownwardEvaluationDetailResponseDto {
    id: string;
    evaluationDate: Date;
    downwardEvaluationContent?: string;
    downwardEvaluationScore?: number;
    evaluationType: string;
    isCompleted: boolean;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    createdBy?: string;
    updatedBy?: string;
    version: number;
    employee?: {
        id: string;
        name: string;
        employeeNumber: string;
        email: string;
        departmentId: string;
        status: string;
    } | null;
    evaluator?: {
        id: string;
        name: string;
        employeeNumber: string;
        email: string;
        departmentId: string;
        status: string;
    } | null;
    wbs?: {
        id: string;
        name: string;
        code: string;
        status: string;
        startDate: Date;
        endDate: Date;
    } | null;
    period?: {
        id: string;
        name: string;
        startDate: Date;
        endDate: Date;
        status: string;
    } | null;
    selfEvaluation?: {
        id: string;
        wbsItemId: string;
        performanceResult: string | null;
        selfEvaluationContent: string | null;
        selfEvaluationScore: number | null;
        isCompleted: boolean;
        completedAt: Date | null;
        evaluationDate: Date;
    } | null;
}
