import { ICommandHandler } from '@nestjs/cqrs';
import { FinalEvaluationService } from '@domain/core/final-evaluation/final-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
export declare class DeleteFinalEvaluationCommand {
    readonly id: string;
    readonly deletedBy: string;
    constructor(id: string, deletedBy?: string);
}
export declare class DeleteFinalEvaluationHandler implements ICommandHandler<DeleteFinalEvaluationCommand> {
    private readonly finalEvaluationService;
    private readonly transactionManager;
    private readonly logger;
    constructor(finalEvaluationService: FinalEvaluationService, transactionManager: TransactionManagerService);
    execute(command: DeleteFinalEvaluationCommand): Promise<void>;
}
