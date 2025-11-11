import { ICommandHandler } from '@nestjs/cqrs';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { EvaluationWbsAssignmentService } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
export declare class ResetWbsSelfEvaluationsToEvaluatorByProjectCommand {
    readonly employeeId: string;
    readonly periodId: string;
    readonly projectId: string;
    readonly resetBy: string;
    constructor(employeeId: string, periodId: string, projectId: string, resetBy?: string);
}
export interface ResetWbsSelfEvaluationToEvaluatorByProjectDetail {
    evaluationId: string;
    wbsItemId: string;
    selfEvaluationContent?: string;
    selfEvaluationScore?: number;
    performanceResult?: string;
    wasSubmittedToEvaluator: boolean;
}
export interface FailedResetWbsSelfEvaluationToEvaluatorByProject {
    evaluationId: string;
    wbsItemId: string;
    reason: string;
}
export interface ResetWbsSelfEvaluationsToEvaluatorByProjectResponse {
    resetCount: number;
    failedCount: number;
    totalCount: number;
    resetEvaluations: ResetWbsSelfEvaluationToEvaluatorByProjectDetail[];
    failedResets: FailedResetWbsSelfEvaluationToEvaluatorByProject[];
}
export declare class ResetWbsSelfEvaluationsToEvaluatorByProjectHandler implements ICommandHandler<ResetWbsSelfEvaluationsToEvaluatorByProjectCommand> {
    private readonly wbsSelfEvaluationService;
    private readonly evaluationWbsAssignmentService;
    private readonly transactionManager;
    private readonly logger;
    constructor(wbsSelfEvaluationService: WbsSelfEvaluationService, evaluationWbsAssignmentService: EvaluationWbsAssignmentService, transactionManager: TransactionManagerService);
    execute(command: ResetWbsSelfEvaluationsToEvaluatorByProjectCommand): Promise<ResetWbsSelfEvaluationsToEvaluatorByProjectResponse>;
}
