import { ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { EmployeeService } from '@domain/common/employee/employee.service';
import { EvaluationPeriodEmployeeMappingService } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service';
import { EvaluationLineService } from '@domain/core/evaluation-line/evaluation-line.service';
import { EvaluationLineMappingService } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.service';
export declare class AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesCommand {
    readonly periodId: string;
    readonly createdBy: string;
    constructor(periodId: string, createdBy: string);
}
export interface AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesResult {
    message: string;
    totalEmployees: number;
    successCount: number;
    skippedCount: number;
    failedCount: number;
    totalCreatedMappings: number;
    results: Array<{
        employeeId: string;
        success: boolean;
        message: string;
        createdMappings: number;
        error?: string;
    }>;
}
export declare class AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesHandler implements ICommandHandler<AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesCommand, AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesResult> {
    private readonly evaluationPeriodEmployeeMappingService;
    private readonly employeeService;
    private readonly evaluationLineService;
    private readonly evaluationLineMappingService;
    private readonly dataSource;
    private readonly logger;
    constructor(evaluationPeriodEmployeeMappingService: EvaluationPeriodEmployeeMappingService, employeeService: EmployeeService, evaluationLineService: EvaluationLineService, evaluationLineMappingService: EvaluationLineMappingService, dataSource: DataSource);
    execute(command: AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesCommand): Promise<AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesResult>;
}
