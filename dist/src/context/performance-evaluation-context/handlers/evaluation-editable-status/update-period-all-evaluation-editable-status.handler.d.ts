import { ICommandHandler } from '@nestjs/cqrs';
import { EvaluationPeriodEmployeeMappingService } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
export declare class UpdatePeriodAllEvaluationEditableStatusCommand {
    readonly evaluationPeriodId: string;
    readonly isSelfEvaluationEditable: boolean;
    readonly isPrimaryEvaluationEditable: boolean;
    readonly isSecondaryEvaluationEditable: boolean;
    readonly updatedBy: string;
    constructor(evaluationPeriodId: string, isSelfEvaluationEditable: boolean, isPrimaryEvaluationEditable: boolean, isSecondaryEvaluationEditable: boolean, updatedBy?: string);
}
export interface UpdatePeriodAllEvaluationEditableStatusResponse {
    updatedCount: number;
    evaluationPeriodId: string;
    isSelfEvaluationEditable: boolean;
    isPrimaryEvaluationEditable: boolean;
    isSecondaryEvaluationEditable: boolean;
}
export declare class UpdatePeriodAllEvaluationEditableStatusHandler implements ICommandHandler<UpdatePeriodAllEvaluationEditableStatusCommand> {
    private readonly evaluationPeriodEmployeeMappingService;
    private readonly transactionManager;
    private readonly logger;
    constructor(evaluationPeriodEmployeeMappingService: EvaluationPeriodEmployeeMappingService, transactionManager: TransactionManagerService);
    execute(command: UpdatePeriodAllEvaluationEditableStatusCommand): Promise<UpdatePeriodAllEvaluationEditableStatusResponse>;
}
