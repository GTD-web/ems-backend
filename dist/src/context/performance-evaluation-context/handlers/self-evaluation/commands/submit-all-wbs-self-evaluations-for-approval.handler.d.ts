import { ICommandHandler } from '@nestjs/cqrs';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';
export declare class SubmitAllWbsSelfEvaluationsForApprovalCommand {
    readonly employeeId: string;
    readonly periodId: string;
    readonly submittedBy: string;
    constructor(employeeId: string, periodId: string, submittedBy?: string);
}
export interface SubmittedWbsSelfEvaluationForApprovalDetail {
    evaluationId: string;
    wbsItemId: string;
    selfEvaluationContent?: string;
    selfEvaluationScore?: number;
    performanceResult?: string;
    submittedToEvaluatorAt: Date;
    submittedToManagerAt: Date;
}
export interface FailedWbsSelfEvaluationForApproval {
    evaluationId: string;
    wbsItemId: string;
    reason: string;
    selfEvaluationContent?: string;
    selfEvaluationScore?: number;
}
export interface SubmitAllWbsSelfEvaluationsForApprovalResponse {
    submittedCount: number;
    failedCount: number;
    totalCount: number;
    completedEvaluations: SubmittedWbsSelfEvaluationForApprovalDetail[];
    failedEvaluations: FailedWbsSelfEvaluationForApproval[];
}
export declare class SubmitAllWbsSelfEvaluationsForApprovalHandler implements ICommandHandler<SubmitAllWbsSelfEvaluationsForApprovalCommand> {
    private readonly wbsSelfEvaluationService;
    private readonly evaluationPeriodService;
    private readonly transactionManager;
    private readonly logger;
    constructor(wbsSelfEvaluationService: WbsSelfEvaluationService, evaluationPeriodService: EvaluationPeriodService, transactionManager: TransactionManagerService);
    execute(command: SubmitAllWbsSelfEvaluationsForApprovalCommand): Promise<SubmitAllWbsSelfEvaluationsForApprovalResponse>;
}
