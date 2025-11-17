export declare class EvaluationLineFilterDto {
    evaluatorType?: string;
    isRequired?: boolean;
    isAutoAssigned?: boolean;
}
export declare class ConfigureEmployeeWbsEvaluationLineDto {
    employeeId: string;
    wbsItemId: string;
    periodId: string;
    createdBy?: string;
}
export declare class ConfigureEmployeeWbsEvaluationLineResponseDto {
    message: string;
    createdLines: number;
    createdMappings: number;
}
export declare class EvaluationLineDto {
    id: string;
    evaluatorType: string;
    order: number;
    isRequired: boolean;
    isAutoAssigned: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare class EvaluationLineMappingDto {
    id: string;
    employeeId: string;
    evaluatorId: string;
    wbsItemId?: string;
    evaluationLineId: string;
    createdBy?: string;
    updatedBy?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class EmployeeEvaluationLineMappingsResponseDto {
    employeeId: string;
    mappings: EvaluationLineMappingDto[];
}
export declare class EvaluatorEmployeesResponseDto {
    evaluatorId: string;
    employees: {
        employeeId: string;
        wbsItemId?: string;
        evaluationLineId: string;
        createdBy?: string;
        updatedBy?: string;
        createdAt: Date;
        updatedAt: Date;
    }[];
}
export declare class EmployeeEvaluationSettingsResponseDto {
    employeeId: string;
    periodId: string;
    projectAssignments: any[];
    wbsAssignments: any[];
    evaluationLineMappings: EvaluationLineMappingDto[];
}
export declare class ConfigurePrimaryEvaluatorDto {
    evaluatorId: string;
}
export declare class ConfigureSecondaryEvaluatorDto {
    evaluatorId: string;
}
export declare class ConfigureEvaluatorResponseDto {
    message: string;
    createdLines: number;
    createdMappings: number;
    mapping: {
        id: string;
        employeeId: string;
        evaluatorId: string;
        wbsItemId: string | null;
        evaluationLineId: string;
    };
}
export declare class EvaluatorTypeQueryDto {
    type?: 'primary' | 'secondary' | 'all';
}
export declare class EvaluatorInfoDto {
    evaluatorId: string;
    evaluatorName: string;
    departmentName: string;
    evaluatorType: 'primary' | 'secondary';
    evaluateeCount: number;
}
export declare class EvaluatorsByPeriodResponseDto {
    periodId: string;
    type: 'primary' | 'secondary' | 'all';
    evaluators: EvaluatorInfoDto[];
}
export declare class PrimaryEvaluatorInfoDto extends EvaluatorInfoDto {
}
export declare class PrimaryEvaluatorsByPeriodResponseDto extends EvaluatorsByPeriodResponseDto {
}
export declare class BatchPrimaryEvaluatorAssignmentItemDto {
    employeeId: string;
    evaluatorId: string;
}
export declare class BatchConfigurePrimaryEvaluatorDto {
    assignments: BatchPrimaryEvaluatorAssignmentItemDto[];
}
export declare class BatchPrimaryEvaluatorResultItemDto {
    employeeId: string;
    evaluatorId: string;
    status: 'success' | 'error';
    message?: string;
    mapping?: {
        id: string;
        employeeId: string;
        evaluatorId: string;
        wbsItemId: string | null;
        evaluationLineId: string;
    };
    error?: string;
}
export declare class BatchConfigurePrimaryEvaluatorResponseDto {
    periodId: string;
    totalCount: number;
    successCount: number;
    failureCount: number;
    createdLines: number;
    createdMappings: number;
    results: BatchPrimaryEvaluatorResultItemDto[];
}
export declare class BatchSecondaryEvaluatorAssignmentItemDto {
    employeeId: string;
    wbsItemId: string;
    evaluatorId: string;
}
export declare class BatchConfigureSecondaryEvaluatorDto {
    assignments: BatchSecondaryEvaluatorAssignmentItemDto[];
}
export declare class BatchSecondaryEvaluatorResultItemDto {
    employeeId: string;
    wbsItemId: string;
    evaluatorId: string;
    status: 'success' | 'error';
    message?: string;
    mapping?: {
        id: string;
        employeeId: string;
        evaluatorId: string;
        wbsItemId: string;
        evaluationLineId: string;
    };
    error?: string;
}
export declare class BatchConfigureSecondaryEvaluatorResponseDto {
    periodId: string;
    totalCount: number;
    successCount: number;
    failureCount: number;
    createdLines: number;
    createdMappings: number;
    results: BatchSecondaryEvaluatorResultItemDto[];
}
