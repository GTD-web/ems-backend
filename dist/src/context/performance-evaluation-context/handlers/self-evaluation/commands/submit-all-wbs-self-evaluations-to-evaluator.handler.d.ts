import { ICommandHandler } from '@nestjs/cqrs';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';
export declare class SubmitAllWbsSelfEvaluationsToEvaluatorCommand {
    readonly employeeId: string;
    readonly periodId: string;
    readonly submittedBy: string;
    constructor(employeeId: string, periodId: string, submittedBy?: string);
}
export interface SubmittedWbsSelfEvaluationToEvaluatorDetail {
    evaluationId: string;
    wbsItemId: string;
    selfEvaluationContent?: string;
    selfEvaluationScore?: number;
    performanceResult?: string;
    submittedToEvaluatorAt: Date;
}
export interface FailedWbsSelfEvaluationToEvaluator {
    evaluationId: string;
    wbsItemId: string;
    reason: string;
    selfEvaluationContent?: string;
    selfEvaluationScore?: number;
}
export interface SubmitAllWbsSelfEvaluationsToEvaluatorResponse {
    submittedCount: number;
    failedCount: number;
    totalCount: number;
    completedEvaluations: SubmittedWbsSelfEvaluationToEvaluatorDetail[];
    failedEvaluations: FailedWbsSelfEvaluationToEvaluator[];
}
export declare class SubmitAllWbsSelfEvaluationsToEvaluatorHandler implements ICommandHandler<SubmitAllWbsSelfEvaluationsToEvaluatorCommand> {
    private readonly wbsSelfEvaluationService;
    private readonly evaluationPeriodService;
    private readonly transactionManager;
    private readonly logger;
    constructor(wbsSelfEvaluationService: WbsSelfEvaluationService, evaluationPeriodService: EvaluationPeriodService, transactionManager: TransactionManagerService);
    execute(command: SubmitAllWbsSelfEvaluationsToEvaluatorCommand): Promise<SubmitAllWbsSelfEvaluationsToEvaluatorResponse>;
}
