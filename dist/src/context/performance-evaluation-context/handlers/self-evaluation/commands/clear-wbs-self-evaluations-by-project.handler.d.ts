import { ICommandHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { EvaluationWbsAssignmentService } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';
export declare class ClearWbsSelfEvaluationsByProjectCommand {
    readonly employeeId: string;
    readonly periodId: string;
    readonly projectId: string;
    readonly clearedBy?: string | undefined;
    constructor(employeeId: string, periodId: string, projectId: string, clearedBy?: string | undefined);
}
export interface ClearedWbsSelfEvaluationByProjectDetail {
    id: string;
    wbsItemId: string;
    selfEvaluationContent?: string;
    selfEvaluationScore?: number;
    performanceResult?: string;
}
export interface ClearWbsSelfEvaluationsByProjectResponse {
    employeeId: string;
    periodId: string;
    projectId: string;
    clearedCount: number;
    clearedEvaluations: ClearedWbsSelfEvaluationByProjectDetail[];
}
export declare class ClearWbsSelfEvaluationsByProjectHandler implements ICommandHandler<ClearWbsSelfEvaluationsByProjectCommand, ClearWbsSelfEvaluationsByProjectResponse> {
    private readonly wbsSelfEvaluationRepository;
    private readonly evaluationWbsAssignmentService;
    private readonly transactionManager;
    private readonly logger;
    constructor(wbsSelfEvaluationRepository: Repository<WbsSelfEvaluation>, evaluationWbsAssignmentService: EvaluationWbsAssignmentService, transactionManager: TransactionManagerService);
    execute(command: ClearWbsSelfEvaluationsByProjectCommand): Promise<ClearWbsSelfEvaluationsByProjectResponse>;
}
