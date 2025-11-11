import { ICommandHandler } from '@nestjs/cqrs';
import { FinalEvaluationService } from '@domain/core/final-evaluation/final-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { JobGrade, JobDetailedGrade } from '@domain/core/final-evaluation/final-evaluation.types';
export declare class UpdateFinalEvaluationCommand {
    readonly id: string;
    readonly evaluationGrade?: string | undefined;
    readonly jobGrade?: JobGrade | undefined;
    readonly jobDetailedGrade?: JobDetailedGrade | undefined;
    readonly finalComments?: string | undefined;
    readonly updatedBy: string;
    constructor(id: string, evaluationGrade?: string | undefined, jobGrade?: JobGrade | undefined, jobDetailedGrade?: JobDetailedGrade | undefined, finalComments?: string | undefined, updatedBy?: string);
}
export declare class UpdateFinalEvaluationHandler implements ICommandHandler<UpdateFinalEvaluationCommand> {
    private readonly finalEvaluationService;
    private readonly transactionManager;
    private readonly logger;
    constructor(finalEvaluationService: FinalEvaluationService, transactionManager: TransactionManagerService);
    execute(command: UpdateFinalEvaluationCommand): Promise<void>;
}
