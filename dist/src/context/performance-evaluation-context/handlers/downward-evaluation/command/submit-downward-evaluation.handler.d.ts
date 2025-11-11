import { ICommandHandler } from '@nestjs/cqrs';
import { DownwardEvaluationService } from '@domain/core/downward-evaluation/downward-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
export declare class SubmitDownwardEvaluationCommand {
    readonly evaluationId: string;
    readonly submittedBy: string;
    constructor(evaluationId: string, submittedBy?: string);
}
export declare class SubmitDownwardEvaluationHandler implements ICommandHandler<SubmitDownwardEvaluationCommand> {
    private readonly downwardEvaluationService;
    private readonly transactionManager;
    private readonly logger;
    constructor(downwardEvaluationService: DownwardEvaluationService, transactionManager: TransactionManagerService);
    execute(command: SubmitDownwardEvaluationCommand): Promise<void>;
}
