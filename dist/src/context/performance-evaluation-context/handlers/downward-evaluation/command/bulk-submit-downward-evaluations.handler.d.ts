import { ICommandHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { DownwardEvaluationService } from '@domain/core/downward-evaluation/downward-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { DownwardEvaluationType } from '@domain/core/downward-evaluation/downward-evaluation.types';
export declare class BulkSubmitDownwardEvaluationsCommand {
    readonly evaluatorId: string;
    readonly evaluateeId: string;
    readonly periodId: string;
    readonly evaluationType: DownwardEvaluationType;
    readonly submittedBy: string;
    constructor(evaluatorId: string, evaluateeId: string, periodId: string, evaluationType: DownwardEvaluationType, submittedBy?: string);
}
export declare class BulkSubmitDownwardEvaluationsHandler implements ICommandHandler<BulkSubmitDownwardEvaluationsCommand> {
    private readonly downwardEvaluationRepository;
    private readonly downwardEvaluationService;
    private readonly transactionManager;
    private readonly logger;
    constructor(downwardEvaluationRepository: Repository<DownwardEvaluation>, downwardEvaluationService: DownwardEvaluationService, transactionManager: TransactionManagerService);
    execute(command: BulkSubmitDownwardEvaluationsCommand): Promise<{
        submittedCount: number;
        skippedCount: number;
        failedCount: number;
        submittedIds: string[];
        skippedIds: string[];
        failedItems: Array<{
            evaluationId: string;
            error: string;
        }>;
    }>;
}
