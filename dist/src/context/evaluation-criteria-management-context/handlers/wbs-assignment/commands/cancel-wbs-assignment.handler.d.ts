import { ICommandHandler } from '@nestjs/cqrs';
import { EvaluationWbsAssignmentService } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { WbsAssignmentWeightCalculationService } from '../../../services/wbs-assignment-weight-calculation.service';
export declare class CancelWbsAssignmentCommand {
    readonly id: string;
    readonly cancelledBy: string;
    constructor(id: string, cancelledBy: string);
}
export declare class CancelWbsAssignmentHandler implements ICommandHandler<CancelWbsAssignmentCommand> {
    private readonly wbsAssignmentService;
    private readonly evaluationPeriodService;
    private readonly transactionManager;
    private readonly weightCalculationService;
    private readonly logger;
    constructor(wbsAssignmentService: EvaluationWbsAssignmentService, evaluationPeriodService: EvaluationPeriodService, transactionManager: TransactionManagerService, weightCalculationService: WbsAssignmentWeightCalculationService);
    execute(command: CancelWbsAssignmentCommand): Promise<void>;
}
