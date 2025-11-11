import { ICommandHandler } from '@nestjs/cqrs';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { EvaluationWbsAssignmentService } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
export declare class ResetWbsSelfEvaluationsByProjectCommand {
    readonly employeeId: string;
    readonly periodId: string;
    readonly projectId: string;
    readonly resetBy: string;
    constructor(employeeId: string, periodId: string, projectId: string, resetBy?: string);
}
export interface ResetWbsSelfEvaluationByProjectDetail {
    evaluationId: string;
    wbsItemId: string;
    selfEvaluationContent?: string;
    selfEvaluationScore?: number;
    performanceResult?: string;
    wasSubmittedToManager: boolean;
}
export interface FailedResetWbsSelfEvaluationByProject {
    evaluationId: string;
    wbsItemId: string;
    reason: string;
}
export interface ResetWbsSelfEvaluationsByProjectResponse {
    resetCount: number;
    failedCount: number;
    totalCount: number;
    resetEvaluations: ResetWbsSelfEvaluationByProjectDetail[];
    failedResets: FailedResetWbsSelfEvaluationByProject[];
}
export declare class ResetWbsSelfEvaluationsByProjectHandler implements ICommandHandler<ResetWbsSelfEvaluationsByProjectCommand> {
    private readonly wbsSelfEvaluationService;
    private readonly evaluationWbsAssignmentService;
    private readonly transactionManager;
    private readonly logger;
    constructor(wbsSelfEvaluationService: WbsSelfEvaluationService, evaluationWbsAssignmentService: EvaluationWbsAssignmentService, transactionManager: TransactionManagerService);
    execute(command: ResetWbsSelfEvaluationsByProjectCommand): Promise<ResetWbsSelfEvaluationsByProjectResponse>;
}
