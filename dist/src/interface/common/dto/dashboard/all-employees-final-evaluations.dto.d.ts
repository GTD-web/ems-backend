export declare class GetAllEmployeesFinalEvaluationsQueryDto {
    startDate?: Date;
    endDate?: Date;
}
export declare class EmployeeBasicDto {
    id: string;
    name: string;
    employeeNumber: string;
    email: string;
    departmentName: string | null;
    rankName: string | null;
}
export declare class PeriodBasicDto {
    id: string;
    name: string;
    startDate: Date;
}
export declare class FinalEvaluationBasicDto {
    id: string;
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
export declare class EmployeeWithFinalEvaluationsDto {
    employee: EmployeeBasicDto;
    finalEvaluations: (FinalEvaluationBasicDto | null)[];
}
export declare class AllEmployeesFinalEvaluationsResponseDto {
    evaluationPeriods: PeriodBasicDto[];
    employees: EmployeeWithFinalEvaluationsDto[];
}
