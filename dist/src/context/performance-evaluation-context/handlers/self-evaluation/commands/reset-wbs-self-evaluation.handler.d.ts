import { ICommandHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { WbsSelfEvaluationDto } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.types';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EmployeeEvaluationStepApprovalService } from '@domain/sub/employee-evaluation-step-approval/employee-evaluation-step-approval.service';
export declare class ResetWbsSelfEvaluationCommand {
    readonly evaluationId: string;
    readonly resetBy: string;
    constructor(evaluationId: string, resetBy?: string);
}
export declare class ResetWbsSelfEvaluationHandler implements ICommandHandler<ResetWbsSelfEvaluationCommand> {
    private readonly wbsSelfEvaluationService;
    private readonly transactionManager;
    private readonly mappingRepository;
    private readonly stepApprovalService;
    private readonly logger;
    constructor(wbsSelfEvaluationService: WbsSelfEvaluationService, transactionManager: TransactionManagerService, mappingRepository: Repository<EvaluationPeriodEmployeeMapping>, stepApprovalService: EmployeeEvaluationStepApprovalService);
    execute(command: ResetWbsSelfEvaluationCommand): Promise<WbsSelfEvaluationDto>;
}
