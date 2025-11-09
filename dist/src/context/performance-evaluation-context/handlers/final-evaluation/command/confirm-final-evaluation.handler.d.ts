import { ICommandHandler } from '@nestjs/cqrs';
import { FinalEvaluationService } from '@domain/core/final-evaluation/final-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
export declare class ConfirmFinalEvaluationCommand {
    readonly id: string;
    readonly confirmedBy: string;
    constructor(id: string, confirmedBy: string);
}
export declare class ConfirmFinalEvaluationHandler implements ICommandHandler<ConfirmFinalEvaluationCommand> {
    private readonly finalEvaluationService;
    private readonly transactionManager;
    private readonly logger;
    constructor(finalEvaluationService: FinalEvaluationService, transactionManager: TransactionManagerService);
    execute(command: ConfirmFinalEvaluationCommand): Promise<void>;
}
