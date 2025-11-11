import { ICommandHandler } from '@nestjs/cqrs';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { WbsSelfEvaluationDto } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.types';
export declare class SubmitWbsSelfEvaluationToEvaluatorCommand {
    readonly evaluationId: string;
    readonly submittedBy: string;
    constructor(evaluationId: string, submittedBy?: string);
}
export declare class SubmitWbsSelfEvaluationToEvaluatorHandler implements ICommandHandler<SubmitWbsSelfEvaluationToEvaluatorCommand> {
    private readonly wbsSelfEvaluationService;
    private readonly transactionManager;
    private readonly logger;
    constructor(wbsSelfEvaluationService: WbsSelfEvaluationService, transactionManager: TransactionManagerService);
    execute(command: SubmitWbsSelfEvaluationToEvaluatorCommand): Promise<WbsSelfEvaluationDto>;
}
