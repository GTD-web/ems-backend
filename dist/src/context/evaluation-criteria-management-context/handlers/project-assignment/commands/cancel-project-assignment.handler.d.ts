import { ICommandHandler } from '@nestjs/cqrs';
import { EvaluationProjectAssignmentService } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.service';
import { ProjectService } from '@domain/common/project/project.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';
export declare class CancelProjectAssignmentCommand {
    readonly id: string;
    readonly cancelledBy: string;
    constructor(id: string, cancelledBy: string);
}
export declare class CancelProjectAssignmentHandler implements ICommandHandler<CancelProjectAssignmentCommand> {
    private readonly projectAssignmentService;
    private readonly projectService;
    private readonly evaluationPeriodService;
    private readonly transactionManager;
    constructor(projectAssignmentService: EvaluationProjectAssignmentService, projectService: ProjectService, evaluationPeriodService: EvaluationPeriodService, transactionManager: TransactionManagerService);
    execute(command: CancelProjectAssignmentCommand): Promise<void>;
}
