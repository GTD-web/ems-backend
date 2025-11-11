import { ICommandHandler } from '@nestjs/cqrs';
import { EvaluationLineService } from '../../../../../domain/core/evaluation-line/evaluation-line.service';
import { EvaluationLineMappingService } from '../../../../../domain/core/evaluation-line-mapping/evaluation-line-mapping.service';
import { EvaluationWbsAssignmentService } from '../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';
export declare class ConfigureEmployeeWbsEvaluationLineCommand {
    readonly employeeId: string;
    readonly wbsItemId: string;
    readonly periodId: string;
    readonly createdBy: string;
    constructor(employeeId: string, wbsItemId: string, periodId: string, createdBy: string);
}
export interface ConfigureEmployeeWbsEvaluationLineResult {
    message: string;
    createdLines: number;
    createdMappings: number;
}
export declare class ConfigureEmployeeWbsEvaluationLineHandler implements ICommandHandler<ConfigureEmployeeWbsEvaluationLineCommand, ConfigureEmployeeWbsEvaluationLineResult> {
    private readonly evaluationLineService;
    private readonly evaluationLineMappingService;
    private readonly evaluationWbsAssignmentService;
    private readonly logger;
    constructor(evaluationLineService: EvaluationLineService, evaluationLineMappingService: EvaluationLineMappingService, evaluationWbsAssignmentService: EvaluationWbsAssignmentService);
    execute(command: ConfigureEmployeeWbsEvaluationLineCommand): Promise<ConfigureEmployeeWbsEvaluationLineResult>;
}
