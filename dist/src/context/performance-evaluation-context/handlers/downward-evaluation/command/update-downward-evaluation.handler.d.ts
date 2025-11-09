import { ICommandHandler } from '@nestjs/cqrs';
import { DownwardEvaluationService } from '@domain/core/downward-evaluation/downward-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
export declare class UpdateDownwardEvaluationCommand {
    readonly evaluationId: string;
    readonly downwardEvaluationContent?: string | undefined;
    readonly downwardEvaluationScore?: number | undefined;
    readonly updatedBy: string;
    constructor(evaluationId: string, downwardEvaluationContent?: string | undefined, downwardEvaluationScore?: number | undefined, updatedBy?: string);
}
export declare class UpdateDownwardEvaluationHandler implements ICommandHandler<UpdateDownwardEvaluationCommand> {
    private readonly downwardEvaluationService;
    private readonly transactionManager;
    private readonly logger;
    constructor(downwardEvaluationService: DownwardEvaluationService, transactionManager: TransactionManagerService);
    execute(command: UpdateDownwardEvaluationCommand): Promise<void>;
}
