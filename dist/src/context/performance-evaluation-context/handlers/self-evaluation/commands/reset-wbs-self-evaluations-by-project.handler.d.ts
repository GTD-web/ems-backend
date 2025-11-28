import { ICommandHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { EvaluationWbsAssignmentService } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EmployeeEvaluationStepApprovalService } from '@domain/sub/employee-evaluation-step-approval/employee-evaluation-step-approval.service';
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
    private readonly mappingRepository;
    private readonly stepApprovalService;
    private readonly logger;
    constructor(wbsSelfEvaluationService: WbsSelfEvaluationService, evaluationWbsAssignmentService: EvaluationWbsAssignmentService, transactionManager: TransactionManagerService, mappingRepository: Repository<EvaluationPeriodEmployeeMapping>, stepApprovalService: EmployeeEvaluationStepApprovalService);
    execute(command: ResetWbsSelfEvaluationsByProjectCommand): Promise<ResetWbsSelfEvaluationsByProjectResponse>;
}
