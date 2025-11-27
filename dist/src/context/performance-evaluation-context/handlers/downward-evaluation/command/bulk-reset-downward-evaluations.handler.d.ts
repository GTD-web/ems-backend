import { ICommandHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { DownwardEvaluationService } from '@domain/core/downward-evaluation/downward-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { DownwardEvaluationType } from '@domain/core/downward-evaluation/downward-evaluation.types';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EmployeeEvaluationStepApprovalService } from '@domain/sub/employee-evaluation-step-approval/employee-evaluation-step-approval.service';
export declare class BulkResetDownwardEvaluationsCommand {
    readonly evaluatorId: string;
    readonly evaluateeId: string;
    readonly periodId: string;
    readonly evaluationType: DownwardEvaluationType;
    readonly resetBy: string;
    constructor(evaluatorId: string, evaluateeId: string, periodId: string, evaluationType: DownwardEvaluationType, resetBy?: string);
}
export declare class BulkResetDownwardEvaluationsHandler implements ICommandHandler<BulkResetDownwardEvaluationsCommand> {
    private readonly downwardEvaluationRepository;
    private readonly mappingRepository;
    private readonly downwardEvaluationService;
    private readonly transactionManager;
    private readonly stepApprovalService;
    private readonly logger;
    constructor(downwardEvaluationRepository: Repository<DownwardEvaluation>, mappingRepository: Repository<EvaluationPeriodEmployeeMapping>, downwardEvaluationService: DownwardEvaluationService, transactionManager: TransactionManagerService, stepApprovalService: EmployeeEvaluationStepApprovalService);
    execute(command: BulkResetDownwardEvaluationsCommand): Promise<{
        resetCount: number;
        skippedCount: number;
        failedCount: number;
        resetIds: string[];
        skippedIds: string[];
        failedItems: Array<{
            evaluationId: string;
            error: string;
        }>;
    }>;
}
