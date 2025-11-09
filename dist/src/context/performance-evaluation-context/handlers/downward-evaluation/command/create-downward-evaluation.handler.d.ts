import { ICommandHandler } from '@nestjs/cqrs';
import { DownwardEvaluationService } from '@domain/core/downward-evaluation/downward-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
export declare class CreateDownwardEvaluationCommand {
    readonly evaluatorId: string;
    readonly evaluateeId: string;
    readonly periodId: string;
    readonly wbsId: string;
    readonly selfEvaluationId?: string | undefined;
    readonly evaluationType: string;
    readonly downwardEvaluationContent?: string | undefined;
    readonly downwardEvaluationScore?: number | undefined;
    readonly createdBy: string;
    constructor(evaluatorId: string, evaluateeId: string, periodId: string, wbsId: string, selfEvaluationId?: string | undefined, evaluationType?: string, downwardEvaluationContent?: string | undefined, downwardEvaluationScore?: number | undefined, createdBy?: string);
}
export declare class CreateDownwardEvaluationHandler implements ICommandHandler<CreateDownwardEvaluationCommand> {
    private readonly downwardEvaluationService;
    private readonly transactionManager;
    private readonly logger;
    constructor(downwardEvaluationService: DownwardEvaluationService, transactionManager: TransactionManagerService);
    execute(command: CreateDownwardEvaluationCommand): Promise<string>;
}
