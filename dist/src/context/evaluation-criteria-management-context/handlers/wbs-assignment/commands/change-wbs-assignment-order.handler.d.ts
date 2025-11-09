import { ICommandHandler } from '@nestjs/cqrs';
import { EvaluationWbsAssignmentService } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { EvaluationWbsAssignmentDto, OrderDirection } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';
export declare class ChangeWbsAssignmentOrderCommand {
    readonly assignmentId: string;
    readonly direction: OrderDirection;
    readonly updatedBy: string;
    constructor(assignmentId: string, direction: OrderDirection, updatedBy: string);
}
export declare class ChangeWbsAssignmentOrderHandler implements ICommandHandler<ChangeWbsAssignmentOrderCommand> {
    private readonly wbsAssignmentService;
    private readonly evaluationPeriodService;
    private readonly transactionManager;
    constructor(wbsAssignmentService: EvaluationWbsAssignmentService, evaluationPeriodService: EvaluationPeriodService, transactionManager: TransactionManagerService);
    execute(command: ChangeWbsAssignmentOrderCommand): Promise<EvaluationWbsAssignmentDto>;
}
