import { ICommandHandler } from '@nestjs/cqrs';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';
export declare class SubmitAllWbsSelfEvaluationsByEmployeePeriodCommand {
    readonly employeeId: string;
    readonly periodId: string;
    readonly submittedBy: string;
    constructor(employeeId: string, periodId: string, submittedBy?: string);
}
export interface SubmittedWbsSelfEvaluationDetail {
    evaluationId: string;
    wbsItemId: string;
    selfEvaluationContent?: string;
    selfEvaluationScore?: number;
    performanceResult?: string;
    submittedToManagerAt: Date;
}
export interface FailedWbsSelfEvaluation {
    evaluationId: string;
    wbsItemId: string;
    reason: string;
    selfEvaluationContent?: string;
    selfEvaluationScore?: number;
}
export interface SubmitAllWbsSelfEvaluationsResponse {
    submittedCount: number;
    failedCount: number;
    totalCount: number;
    completedEvaluations: SubmittedWbsSelfEvaluationDetail[];
    failedEvaluations: FailedWbsSelfEvaluation[];
}
export declare class SubmitAllWbsSelfEvaluationsByEmployeePeriodHandler implements ICommandHandler<SubmitAllWbsSelfEvaluationsByEmployeePeriodCommand> {
    private readonly wbsSelfEvaluationService;
    private readonly evaluationPeriodService;
    private readonly transactionManager;
    private readonly logger;
    constructor(wbsSelfEvaluationService: WbsSelfEvaluationService, evaluationPeriodService: EvaluationPeriodService, transactionManager: TransactionManagerService);
    execute(command: SubmitAllWbsSelfEvaluationsByEmployeePeriodCommand): Promise<SubmitAllWbsSelfEvaluationsResponse>;
}
