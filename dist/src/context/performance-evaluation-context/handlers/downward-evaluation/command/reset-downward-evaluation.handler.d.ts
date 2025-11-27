import { ICommandHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { DownwardEvaluationService } from '@domain/core/downward-evaluation/downward-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EmployeeEvaluationStepApprovalService } from '@domain/sub/employee-evaluation-step-approval/employee-evaluation-step-approval.service';
export declare class ResetDownwardEvaluationCommand {
    readonly evaluationId: string;
    readonly resetBy: string;
    constructor(evaluationId: string, resetBy?: string);
}
export declare class ResetDownwardEvaluationHandler implements ICommandHandler<ResetDownwardEvaluationCommand> {
    private readonly downwardEvaluationService;
    private readonly transactionManager;
    private readonly mappingRepository;
    private readonly stepApprovalService;
    private readonly logger;
    constructor(downwardEvaluationService: DownwardEvaluationService, transactionManager: TransactionManagerService, mappingRepository: Repository<EvaluationPeriodEmployeeMapping>, stepApprovalService: EmployeeEvaluationStepApprovalService);
    execute(command: ResetDownwardEvaluationCommand): Promise<void>;
}
