import { ICommandHandler } from '@nestjs/cqrs';
import { DownwardEvaluationService } from '@domain/core/downward-evaluation/downward-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
export declare class ResetDownwardEvaluationCommand {
    readonly evaluationId: string;
    readonly resetBy: string;
    constructor(evaluationId: string, resetBy?: string);
}
export declare class ResetDownwardEvaluationHandler implements ICommandHandler<ResetDownwardEvaluationCommand> {
    private readonly downwardEvaluationService;
    private readonly transactionManager;
    private readonly logger;
    constructor(downwardEvaluationService: DownwardEvaluationService, transactionManager: TransactionManagerService);
    execute(command: ResetDownwardEvaluationCommand): Promise<void>;
}
