import { ICommandHandler } from '@nestjs/cqrs';
import { PeerEvaluationService } from '@domain/core/peer-evaluation/peer-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { EmployeeService } from '@domain/common/employee/employee.service';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';
export declare class CreatePeerEvaluationCommand {
    readonly evaluatorId: string;
    readonly evaluateeId: string;
    readonly periodId: string;
    readonly projectId: string;
    readonly requestDeadline?: Date | undefined;
    readonly createdBy: string;
    constructor(evaluatorId: string, evaluateeId: string, periodId: string, projectId: string, requestDeadline?: Date | undefined, createdBy?: string);
}
export declare class CreatePeerEvaluationHandler implements ICommandHandler<CreatePeerEvaluationCommand> {
    private readonly peerEvaluationService;
    private readonly employeeService;
    private readonly evaluationPeriodService;
    private readonly transactionManager;
    private readonly logger;
    constructor(peerEvaluationService: PeerEvaluationService, employeeService: EmployeeService, evaluationPeriodService: EvaluationPeriodService, transactionManager: TransactionManagerService);
    execute(command: CreatePeerEvaluationCommand): Promise<string>;
}
