import { ICommandHandler } from '@nestjs/cqrs';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
export declare class ResetAllWbsSelfEvaluationsToEvaluatorCommand {
    readonly employeeId: string;
    readonly periodId: string;
    readonly resetBy: string;
    constructor(employeeId: string, periodId: string, resetBy?: string);
}
export interface ResetWbsSelfEvaluationToEvaluatorDetail {
    evaluationId: string;
    wbsItemId: string;
    selfEvaluationContent?: string;
    selfEvaluationScore?: number;
    performanceResult?: string;
    wasSubmittedToEvaluator: boolean;
}
export interface FailedResetWbsSelfEvaluationToEvaluator {
    evaluationId: string;
    wbsItemId: string;
    reason: string;
}
export interface ResetAllWbsSelfEvaluationsToEvaluatorResponse {
    resetCount: number;
    failedCount: number;
    totalCount: number;
    resetEvaluations: ResetWbsSelfEvaluationToEvaluatorDetail[];
    failedResets: FailedResetWbsSelfEvaluationToEvaluator[];
}
export declare class ResetAllWbsSelfEvaluationsToEvaluatorHandler implements ICommandHandler<ResetAllWbsSelfEvaluationsToEvaluatorCommand> {
    private readonly wbsSelfEvaluationService;
    private readonly transactionManager;
    private readonly logger;
    constructor(wbsSelfEvaluationService: WbsSelfEvaluationService, transactionManager: TransactionManagerService);
    execute(command: ResetAllWbsSelfEvaluationsToEvaluatorCommand): Promise<ResetAllWbsSelfEvaluationsToEvaluatorResponse>;
}
