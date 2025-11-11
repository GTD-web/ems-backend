import { ICommandHandler } from '@nestjs/cqrs';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { WbsSelfEvaluationDto } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.types';
export declare class ResetWbsSelfEvaluationToEvaluatorCommand {
    readonly evaluationId: string;
    readonly resetBy: string;
    constructor(evaluationId: string, resetBy?: string);
}
export declare class ResetWbsSelfEvaluationToEvaluatorHandler implements ICommandHandler<ResetWbsSelfEvaluationToEvaluatorCommand> {
    private readonly wbsSelfEvaluationService;
    private readonly transactionManager;
    private readonly logger;
    constructor(wbsSelfEvaluationService: WbsSelfEvaluationService, transactionManager: TransactionManagerService);
    execute(command: ResetWbsSelfEvaluationToEvaluatorCommand): Promise<WbsSelfEvaluationDto>;
}
