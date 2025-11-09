import { ICommandHandler } from '@nestjs/cqrs';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { WbsSelfEvaluationDto } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.types';
export declare class CreateWbsSelfEvaluationCommand {
    readonly periodId: string;
    readonly employeeId: string;
    readonly wbsItemId: string;
    readonly selfEvaluationContent: string;
    readonly selfEvaluationScore: number;
    readonly performanceResult?: string | undefined;
    readonly createdBy: string;
    constructor(periodId: string, employeeId: string, wbsItemId: string, selfEvaluationContent: string, selfEvaluationScore: number, performanceResult?: string | undefined, createdBy?: string);
}
export declare class CreateWbsSelfEvaluationHandler implements ICommandHandler<CreateWbsSelfEvaluationCommand> {
    private readonly wbsSelfEvaluationService;
    private readonly transactionManager;
    private readonly logger;
    constructor(wbsSelfEvaluationService: WbsSelfEvaluationService, transactionManager: TransactionManagerService);
    execute(command: CreateWbsSelfEvaluationCommand): Promise<WbsSelfEvaluationDto>;
}
