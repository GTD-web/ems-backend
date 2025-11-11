import { ICommandHandler } from '@nestjs/cqrs';
import { FinalEvaluationService } from '@domain/core/final-evaluation/final-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
export declare class CancelConfirmationFinalEvaluationCommand {
    readonly id: string;
    readonly updatedBy: string;
    constructor(id: string, updatedBy: string);
}
export declare class CancelConfirmationFinalEvaluationHandler implements ICommandHandler<CancelConfirmationFinalEvaluationCommand> {
    private readonly finalEvaluationService;
    private readonly transactionManager;
    private readonly logger;
    constructor(finalEvaluationService: FinalEvaluationService, transactionManager: TransactionManagerService);
    execute(command: CancelConfirmationFinalEvaluationCommand): Promise<void>;
}
