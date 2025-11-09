import { ICommandHandler } from '@nestjs/cqrs';
import { EvaluationProjectAssignmentService } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.service';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { EvaluationProjectAssignmentDto, OrderDirection } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.types';
export declare class ChangeProjectAssignmentOrderCommand {
    readonly assignmentId: string;
    readonly direction: OrderDirection;
    readonly updatedBy: string;
    constructor(assignmentId: string, direction: OrderDirection, updatedBy: string);
}
export declare class ChangeProjectAssignmentOrderHandler implements ICommandHandler<ChangeProjectAssignmentOrderCommand> {
    private readonly projectAssignmentService;
    private readonly evaluationPeriodService;
    private readonly transactionManager;
    constructor(projectAssignmentService: EvaluationProjectAssignmentService, evaluationPeriodService: EvaluationPeriodService, transactionManager: TransactionManagerService);
    execute(command: ChangeProjectAssignmentOrderCommand): Promise<EvaluationProjectAssignmentDto>;
}
