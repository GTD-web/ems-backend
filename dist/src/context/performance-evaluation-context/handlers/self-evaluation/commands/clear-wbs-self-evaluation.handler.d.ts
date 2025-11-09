import { ICommandHandler } from '@nestjs/cqrs';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { WbsSelfEvaluationDto } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.types';
export declare class ClearWbsSelfEvaluationCommand {
    readonly evaluationId: string;
    readonly clearedBy?: string | undefined;
    constructor(evaluationId: string, clearedBy?: string | undefined);
}
export declare class ClearWbsSelfEvaluationHandler implements ICommandHandler<ClearWbsSelfEvaluationCommand> {
    private readonly wbsSelfEvaluationService;
    private readonly logger;
    constructor(wbsSelfEvaluationService: WbsSelfEvaluationService);
    execute(command: ClearWbsSelfEvaluationCommand): Promise<WbsSelfEvaluationDto>;
}
