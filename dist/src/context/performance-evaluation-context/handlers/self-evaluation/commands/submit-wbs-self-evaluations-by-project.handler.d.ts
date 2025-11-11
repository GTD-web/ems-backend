import { ICommandHandler } from '@nestjs/cqrs';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { EvaluationWbsAssignmentService } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';
export declare class SubmitWbsSelfEvaluationsByProjectCommand {
    readonly employeeId: string;
    readonly periodId: string;
    readonly projectId: string;
    readonly submittedBy: string;
    constructor(employeeId: string, periodId: string, projectId: string, submittedBy?: string);
}
export interface SubmittedWbsSelfEvaluationByProjectDetail {
    evaluationId: string;
    wbsItemId: string;
    selfEvaluationContent?: string;
    selfEvaluationScore?: number;
    performanceResult?: string;
    submittedToManagerAt: Date;
}
export interface FailedWbsSelfEvaluationByProject {
    evaluationId: string;
    wbsItemId: string;
    reason: string;
    selfEvaluationContent?: string;
    selfEvaluationScore?: number;
}
export interface SubmitWbsSelfEvaluationsByProjectResponse {
    submittedCount: number;
    failedCount: number;
    totalCount: number;
    completedEvaluations: SubmittedWbsSelfEvaluationByProjectDetail[];
    failedEvaluations: FailedWbsSelfEvaluationByProject[];
}
export declare class SubmitWbsSelfEvaluationsByProjectHandler implements ICommandHandler<SubmitWbsSelfEvaluationsByProjectCommand> {
    private readonly wbsSelfEvaluationService;
    private readonly evaluationWbsAssignmentService;
    private readonly evaluationPeriodService;
    private readonly transactionManager;
    private readonly logger;
    constructor(wbsSelfEvaluationService: WbsSelfEvaluationService, evaluationWbsAssignmentService: EvaluationWbsAssignmentService, evaluationPeriodService: EvaluationPeriodService, transactionManager: TransactionManagerService);
    execute(command: SubmitWbsSelfEvaluationsByProjectCommand): Promise<SubmitWbsSelfEvaluationsByProjectResponse>;
}
