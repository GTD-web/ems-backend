export declare class GetEmployeeFinalEvaluationsQueryDto {
    startDate?: Date;
    endDate?: Date;
}
export declare class EmployeeBasicInfoDto {
    id: string;
    name: string;
    employeeNumber: string;
    email: string;
    departmentName: string | null;
    rankName: string | null;
    status?: '재직중' | '휴직중' | '퇴사';
    hireDate?: Date | null;
}
export declare class EvaluationPeriodInfoDto {
    id: string;
    name: string;
    startDate: Date;
}
export declare class FinalEvaluationItemDto {
    id: string;
    period: EvaluationPeriodInfoDto;
    evaluationGrade: string;
    jobGrade: string;
    jobDetailedGrade: string;
    finalComments: string | null;
    isConfirmed: boolean;
    confirmedAt: Date | null;
    confirmedBy: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export declare class EmployeeFinalEvaluationListResponseDto {
    employee: EmployeeBasicInfoDto;
    finalEvaluations: FinalEvaluationItemDto[];
}
