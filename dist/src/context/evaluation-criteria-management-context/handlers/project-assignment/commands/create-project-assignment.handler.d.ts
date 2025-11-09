import { ICommandHandler } from '@nestjs/cqrs';
import { EvaluationProjectAssignmentService } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.service';
import { ProjectService } from '@domain/common/project/project.service';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { EvaluationProjectAssignmentDto, CreateEvaluationProjectAssignmentData } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.types';
export declare class CreateProjectAssignmentCommand {
    readonly data: CreateEvaluationProjectAssignmentData;
    readonly assignedBy: string;
    constructor(data: CreateEvaluationProjectAssignmentData, assignedBy: string);
}
export declare class CreateProjectAssignmentHandler implements ICommandHandler<CreateProjectAssignmentCommand> {
    private readonly projectAssignmentService;
    private readonly projectService;
    private readonly evaluationPeriodService;
    private readonly transactionManager;
    constructor(projectAssignmentService: EvaluationProjectAssignmentService, projectService: ProjectService, evaluationPeriodService: EvaluationPeriodService, transactionManager: TransactionManagerService);
    execute(command: CreateProjectAssignmentCommand): Promise<EvaluationProjectAssignmentDto>;
}
