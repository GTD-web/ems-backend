import { ICommandHandler } from '@nestjs/cqrs';
import { EvaluationPeriodService } from '../../../../../domain/core/evaluation-period/evaluation-period.service';
export declare class CompleteEvaluationPeriodCommand {
    readonly periodId: string;
    readonly completedBy: string;
    constructor(periodId: string, completedBy: string);
}
export declare class CompleteEvaluationPeriodCommandHandler implements ICommandHandler<CompleteEvaluationPeriodCommand, boolean> {
    private readonly evaluationPeriodService;
    constructor(evaluationPeriodService: EvaluationPeriodService);
    execute(command: CompleteEvaluationPeriodCommand): Promise<boolean>;
}
