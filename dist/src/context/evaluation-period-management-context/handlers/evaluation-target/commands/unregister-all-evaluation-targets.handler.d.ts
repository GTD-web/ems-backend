import { ICommandHandler } from '@nestjs/cqrs';
import { EvaluationPeriodEmployeeMappingService } from '../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service';
export declare class UnregisterAllEvaluationTargetsCommand {
    readonly evaluationPeriodId: string;
    constructor(evaluationPeriodId: string);
}
export declare class UnregisterAllEvaluationTargetsHandler implements ICommandHandler<UnregisterAllEvaluationTargetsCommand, number> {
    private readonly evaluationPeriodEmployeeMappingService;
    private readonly logger;
    constructor(evaluationPeriodEmployeeMappingService: EvaluationPeriodEmployeeMappingService);
    execute(command: UnregisterAllEvaluationTargetsCommand): Promise<number>;
}
