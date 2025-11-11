import { ICommandHandler } from '@nestjs/cqrs';
import { FinalEvaluationService } from '@domain/core/final-evaluation/final-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { JobGrade, JobDetailedGrade } from '@domain/core/final-evaluation/final-evaluation.types';
export declare class CreateFinalEvaluationCommand {
    readonly employeeId: string;
    readonly periodId: string;
    readonly evaluationGrade: string;
    readonly jobGrade: JobGrade;
    readonly jobDetailedGrade: JobDetailedGrade;
    readonly finalComments?: string | undefined;
    readonly createdBy: string;
    constructor(employeeId: string, periodId: string, evaluationGrade: string, jobGrade: JobGrade, jobDetailedGrade: JobDetailedGrade, finalComments?: string | undefined, createdBy?: string);
}
export declare class CreateFinalEvaluationHandler implements ICommandHandler<CreateFinalEvaluationCommand> {
    private readonly finalEvaluationService;
    private readonly transactionManager;
    private readonly logger;
    constructor(finalEvaluationService: FinalEvaluationService, transactionManager: TransactionManagerService);
    execute(command: CreateFinalEvaluationCommand): Promise<string>;
}
