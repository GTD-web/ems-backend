export declare class EmployeeInfoDto {
    id: string;
    name: string;
    employeeNumber: string;
    email: string;
    departmentName: string | null;
    rankName: string | null;
    status?: '재직중' | '휴직중' | '퇴사';
    hireDate?: Date | null;
}
export declare class PeriodInfoDto {
    id: string;
    name: string;
    startDate: Date;
}
export declare class EvaluationInfoDto {
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
export declare class EmployeeEvaluationItemDto {
    employee: EmployeeInfoDto;
    evaluation: EvaluationInfoDto;
}
export declare class DashboardFinalEvaluationsByPeriodResponseDto {
    period: PeriodInfoDto;
    evaluations: EmployeeEvaluationItemDto[];
}
