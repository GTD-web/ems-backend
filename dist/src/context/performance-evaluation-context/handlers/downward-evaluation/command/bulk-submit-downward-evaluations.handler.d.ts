import { ICommandHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { DownwardEvaluationService } from '@domain/core/downward-evaluation/downward-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { DownwardEvaluationType } from '@domain/core/downward-evaluation/downward-evaluation.types';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { Employee } from '@domain/common/employee/employee.entity';
export declare class BulkSubmitDownwardEvaluationsCommand {
    readonly evaluatorId: string;
    readonly evaluateeId: string;
    readonly periodId: string;
    readonly evaluationType: DownwardEvaluationType;
    readonly submittedBy: string;
    readonly forceSubmit: boolean;
    constructor(evaluatorId: string, evaluateeId: string, periodId: string, evaluationType: DownwardEvaluationType, submittedBy?: string, forceSubmit?: boolean);
}
export declare class BulkSubmitDownwardEvaluationsHandler implements ICommandHandler<BulkSubmitDownwardEvaluationsCommand> {
    private readonly downwardEvaluationRepository;
    private readonly evaluationLineMappingRepository;
    private readonly evaluationLineRepository;
    private readonly wbsAssignmentRepository;
    private readonly employeeRepository;
    private readonly downwardEvaluationService;
    private readonly transactionManager;
    private readonly logger;
    constructor(downwardEvaluationRepository: Repository<DownwardEvaluation>, evaluationLineMappingRepository: Repository<EvaluationLineMapping>, evaluationLineRepository: Repository<EvaluationLine>, wbsAssignmentRepository: Repository<EvaluationWbsAssignment>, employeeRepository: Repository<Employee>, downwardEvaluationService: DownwardEvaluationService, transactionManager: TransactionManagerService);
    execute(command: BulkSubmitDownwardEvaluationsCommand): Promise<{
        submittedCount: number;
        skippedCount: number;
        failedCount: number;
        submittedIds: string[];
        skippedIds: string[];
        failedItems: Array<{
            evaluationId: string;
            error: string;
        }>;
    }>;
    private 할당된_WBS에_대한_하향평가를_생성한다;
}
