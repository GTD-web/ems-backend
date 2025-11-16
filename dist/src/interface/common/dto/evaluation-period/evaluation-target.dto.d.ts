import { EvaluationPeriodPhase, EvaluationPeriodStatus } from '@domain/core/evaluation-period/evaluation-period.types';
export declare class EvaluationPeriodBasicInfoDto {
    id: string;
    name: string;
    startDate: Date;
    endDate?: Date | null;
    status: EvaluationPeriodStatus;
    currentPhase?: EvaluationPeriodPhase | null;
}
export declare class EmployeeBasicInfoDto {
    id: string;
    employeeNumber: string;
    name: string;
    email: string;
    departmentName?: string;
    rankName?: string;
    status: string;
}
export declare class RegisterEvaluationTargetDto {
}
export declare class RegisterBulkEvaluationTargetsDto {
    employeeIds: string[];
}
export declare class ExcludeEvaluationTargetDto {
    excludeReason: string;
}
export declare class IncludeEvaluationTargetDto {
}
export declare class EvaluationTargetItemDto {
    id: string;
    employee: EmployeeBasicInfoDto;
    isExcluded: boolean;
    excludeReason?: string | null;
    excludedBy?: string | null;
    excludedAt?: Date | null;
    createdBy: string;
    updatedBy?: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
    version: number;
}
export declare class EvaluationTargetsResponseDto {
    evaluationPeriodId: string;
    targets: EvaluationTargetItemDto[];
}
export declare class EmployeeEvaluationPeriodMappingItemDto {
    id: string;
    evaluationPeriod: EvaluationPeriodBasicInfoDto;
    isExcluded: boolean;
    excludeReason?: string | null;
    excludedBy?: string | null;
    excludedAt?: Date | null;
    createdBy: string;
    updatedBy?: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
    version: number;
}
export declare class EmployeeEvaluationPeriodsResponseDto {
    employee: EmployeeBasicInfoDto;
    mappings: EmployeeEvaluationPeriodMappingItemDto[];
}
export declare class EvaluationTargetMappingResponseDto {
    id: string;
    evaluationPeriodId: string;
    employeeId: string;
    employee: EmployeeBasicInfoDto;
    isExcluded: boolean;
    excludeReason?: string | null;
    excludedBy?: string | null;
    excludedAt?: Date | null;
    createdBy: string;
    updatedBy: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    version: number;
}
export declare class EvaluationTargetStatusResponseDto {
    isEvaluationTarget: boolean;
    evaluationPeriod: EvaluationPeriodBasicInfoDto;
    employee: EmployeeBasicInfoDto;
}
export declare class UnregisteredEmployeesResponseDto {
    evaluationPeriodId: string;
    employees: EmployeeBasicInfoDto[];
}
