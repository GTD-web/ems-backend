import { ICommandHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
export declare class ClearAllWbsSelfEvaluationsByEmployeePeriodCommand {
    readonly employeeId: string;
    readonly periodId: string;
    readonly clearedBy?: string | undefined;
    constructor(employeeId: string, periodId: string, clearedBy?: string | undefined);
}
export interface ClearedWbsSelfEvaluationDetail {
    id: string;
    wbsItemId: string;
    selfEvaluationContent?: string;
    selfEvaluationScore?: number;
    performanceResult?: string;
}
export interface ClearAllWbsSelfEvaluationsResponse {
    employeeId: string;
    periodId: string;
    clearedCount: number;
    clearedEvaluations: ClearedWbsSelfEvaluationDetail[];
}
export declare class ClearAllWbsSelfEvaluationsByEmployeePeriodHandler implements ICommandHandler<ClearAllWbsSelfEvaluationsByEmployeePeriodCommand, ClearAllWbsSelfEvaluationsResponse> {
    private readonly wbsSelfEvaluationRepository;
    private readonly transactionManager;
    private readonly logger;
    constructor(wbsSelfEvaluationRepository: Repository<WbsSelfEvaluation>, transactionManager: TransactionManagerService);
    execute(command: ClearAllWbsSelfEvaluationsByEmployeePeriodCommand): Promise<ClearAllWbsSelfEvaluationsResponse>;
}
