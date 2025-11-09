import { WbsSelfEvaluationDto } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.types';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { ICommandHandler } from '@nestjs/cqrs';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
export declare class UpdateWbsSelfEvaluationCommand {
    readonly evaluationId: string;
    readonly selfEvaluationContent?: string | undefined;
    readonly selfEvaluationScore?: number | undefined;
    readonly performanceResult?: string | undefined;
    readonly updatedBy: string;
    constructor(evaluationId: string, selfEvaluationContent?: string | undefined, selfEvaluationScore?: number | undefined, performanceResult?: string | undefined, updatedBy?: string);
}
export declare class UpdateWbsSelfEvaluationHandler implements ICommandHandler<UpdateWbsSelfEvaluationCommand> {
    private readonly wbsSelfEvaluationService;
    private readonly transactionManager;
    private readonly logger;
    constructor(wbsSelfEvaluationService: WbsSelfEvaluationService, transactionManager: TransactionManagerService);
    execute(command: UpdateWbsSelfEvaluationCommand): Promise<WbsSelfEvaluationDto>;
}
