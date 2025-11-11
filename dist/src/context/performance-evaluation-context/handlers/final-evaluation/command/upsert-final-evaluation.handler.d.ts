import { ICommandHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { FinalEvaluationService } from '@domain/core/final-evaluation/final-evaluation.service';
import { FinalEvaluation } from '@domain/core/final-evaluation/final-evaluation.entity';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { JobGrade, JobDetailedGrade } from '@domain/core/final-evaluation/final-evaluation.types';
export declare class UpsertFinalEvaluationCommand {
    readonly employeeId: string;
    readonly periodId: string;
    readonly evaluationGrade: string;
    readonly jobGrade: JobGrade;
    readonly jobDetailedGrade: JobDetailedGrade;
    readonly finalComments?: string | undefined;
    readonly actionBy: string;
    constructor(employeeId: string, periodId: string, evaluationGrade: string, jobGrade: JobGrade, jobDetailedGrade: JobDetailedGrade, finalComments?: string | undefined, actionBy?: string);
}
export declare class UpsertFinalEvaluationHandler implements ICommandHandler<UpsertFinalEvaluationCommand> {
    private readonly finalEvaluationService;
    private readonly finalEvaluationRepository;
    private readonly transactionManager;
    private readonly logger;
    constructor(finalEvaluationService: FinalEvaluationService, finalEvaluationRepository: Repository<FinalEvaluation>, transactionManager: TransactionManagerService);
    execute(command: UpsertFinalEvaluationCommand): Promise<string>;
}
