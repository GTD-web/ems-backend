import { ICommandHandler } from '@nestjs/cqrs';
import { EvaluationPeriodEmployeeMappingService } from '../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service';
import { EvaluationPeriodEmployeeMappingDto } from '../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.types';
export declare class IncludeEvaluationTargetCommand {
    readonly evaluationPeriodId: string;
    readonly employeeId: string;
    readonly updatedBy: string;
    constructor(evaluationPeriodId: string, employeeId: string, updatedBy: string);
}
export declare class IncludeEvaluationTargetHandler implements ICommandHandler<IncludeEvaluationTargetCommand, EvaluationPeriodEmployeeMappingDto> {
    private readonly evaluationPeriodEmployeeMappingService;
    private readonly logger;
    constructor(evaluationPeriodEmployeeMappingService: EvaluationPeriodEmployeeMappingService);
    execute(command: IncludeEvaluationTargetCommand): Promise<EvaluationPeriodEmployeeMappingDto>;
}
