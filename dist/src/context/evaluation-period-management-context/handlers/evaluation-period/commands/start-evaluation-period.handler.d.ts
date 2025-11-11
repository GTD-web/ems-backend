import { ICommandHandler } from '@nestjs/cqrs';
import { EvaluationPeriodService } from '../../../../../domain/core/evaluation-period/evaluation-period.service';
export declare class StartEvaluationPeriodCommand {
    readonly periodId: string;
    readonly startedBy: string;
    constructor(periodId: string, startedBy: string);
}
export declare class StartEvaluationPeriodCommandHandler implements ICommandHandler<StartEvaluationPeriodCommand, boolean> {
    private readonly evaluationPeriodService;
    constructor(evaluationPeriodService: EvaluationPeriodService);
    execute(command: StartEvaluationPeriodCommand): Promise<boolean>;
}
