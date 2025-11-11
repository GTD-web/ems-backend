import { ICommandHandler } from '@nestjs/cqrs';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
export declare class ResetAllWbsSelfEvaluationsByEmployeePeriodCommand {
    readonly employeeId: string;
    readonly periodId: string;
    readonly resetBy: string;
    constructor(employeeId: string, periodId: string, resetBy?: string);
}
export interface ResetWbsSelfEvaluationDetail {
    evaluationId: string;
    wbsItemId: string;
    selfEvaluationContent?: string;
    selfEvaluationScore?: number;
    performanceResult?: string;
    wasSubmittedToManager: boolean;
}
export interface FailedResetWbsSelfEvaluation {
    evaluationId: string;
    wbsItemId: string;
    reason: string;
}
export interface ResetAllWbsSelfEvaluationsResponse {
    resetCount: number;
    failedCount: number;
    totalCount: number;
    resetEvaluations: ResetWbsSelfEvaluationDetail[];
    failedResets: FailedResetWbsSelfEvaluation[];
}
export declare class ResetAllWbsSelfEvaluationsByEmployeePeriodHandler implements ICommandHandler<ResetAllWbsSelfEvaluationsByEmployeePeriodCommand> {
    private readonly wbsSelfEvaluationService;
    private readonly transactionManager;
    private readonly logger;
    constructor(wbsSelfEvaluationService: WbsSelfEvaluationService, transactionManager: TransactionManagerService);
    execute(command: ResetAllWbsSelfEvaluationsByEmployeePeriodCommand): Promise<ResetAllWbsSelfEvaluationsResponse>;
}
