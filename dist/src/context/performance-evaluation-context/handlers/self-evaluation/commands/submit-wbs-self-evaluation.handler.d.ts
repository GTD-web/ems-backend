import { ICommandHandler } from '@nestjs/cqrs';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { WbsSelfEvaluationDto } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.types';
export declare class SubmitWbsSelfEvaluationCommand {
    readonly evaluationId: string;
    readonly submittedBy: string;
    constructor(evaluationId: string, submittedBy?: string);
}
export declare class SubmitWbsSelfEvaluationHandler implements ICommandHandler<SubmitWbsSelfEvaluationCommand> {
    private readonly wbsSelfEvaluationService;
    private readonly evaluationPeriodService;
    private readonly transactionManager;
    private readonly logger;
    constructor(wbsSelfEvaluationService: WbsSelfEvaluationService, evaluationPeriodService: EvaluationPeriodService, transactionManager: TransactionManagerService);
    execute(command: SubmitWbsSelfEvaluationCommand): Promise<WbsSelfEvaluationDto>;
}
