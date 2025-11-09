import { ICommandHandler } from '@nestjs/cqrs';
import { EvaluationPeriodEmployeeMappingService } from '../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service';
export declare class UnregisterEvaluationTargetCommand {
    readonly evaluationPeriodId: string;
    readonly employeeId: string;
    constructor(evaluationPeriodId: string, employeeId: string);
}
export declare class UnregisterEvaluationTargetHandler implements ICommandHandler<UnregisterEvaluationTargetCommand, boolean> {
    private readonly evaluationPeriodEmployeeMappingService;
    private readonly logger;
    constructor(evaluationPeriodEmployeeMappingService: EvaluationPeriodEmployeeMappingService);
    execute(command: UnregisterEvaluationTargetCommand): Promise<boolean>;
}
