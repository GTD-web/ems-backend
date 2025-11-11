import { ICommandHandler } from '@nestjs/cqrs';
import { EvaluationPeriodEmployeeMappingService } from '../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service';
import { EvaluationPeriodEmployeeMappingDto } from '../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.types';
export declare class ExcludeEvaluationTargetCommand {
    readonly evaluationPeriodId: string;
    readonly employeeId: string;
    readonly excludeReason: string;
    readonly excludedBy: string;
    constructor(evaluationPeriodId: string, employeeId: string, excludeReason: string, excludedBy: string);
}
export declare class ExcludeEvaluationTargetHandler implements ICommandHandler<ExcludeEvaluationTargetCommand, EvaluationPeriodEmployeeMappingDto> {
    private readonly evaluationPeriodEmployeeMappingService;
    private readonly logger;
    constructor(evaluationPeriodEmployeeMappingService: EvaluationPeriodEmployeeMappingService);
    execute(command: ExcludeEvaluationTargetCommand): Promise<EvaluationPeriodEmployeeMappingDto>;
}
