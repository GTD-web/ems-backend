import { ICommandHandler } from '@nestjs/cqrs';
import { EvaluationPeriodService } from '../../../../../domain/core/evaluation-period/evaluation-period.service';
export declare class DeleteEvaluationPeriodCommand {
    readonly periodId: string;
    readonly deletedBy: string;
    constructor(periodId: string, deletedBy: string);
}
export declare class DeleteEvaluationPeriodCommandHandler implements ICommandHandler<DeleteEvaluationPeriodCommand, boolean> {
    private readonly evaluationPeriodService;
    constructor(evaluationPeriodService: EvaluationPeriodService);
    execute(command: DeleteEvaluationPeriodCommand): Promise<boolean>;
}
