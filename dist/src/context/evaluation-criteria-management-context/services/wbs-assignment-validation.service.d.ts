import { EntityManager, Repository } from 'typeorm';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { WbsItemService } from '@domain/common/wbs-item/wbs-item.service';
import type { CreateEvaluationWbsAssignmentData } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';
export declare class WbsAssignmentValidationService {
    private readonly projectAssignmentRepository;
    private readonly employeeRepository;
    private readonly wbsAssignmentRepository;
    private readonly transactionManager;
    private readonly evaluationPeriodService;
    private readonly wbsItemService;
    constructor(projectAssignmentRepository: Repository<EvaluationProjectAssignment>, employeeRepository: Repository<Employee>, wbsAssignmentRepository: Repository<EvaluationWbsAssignment>, transactionManager: TransactionManagerService, evaluationPeriodService: EvaluationPeriodService, wbsItemService: WbsItemService);
    할당생성비즈니스규칙검증한다(data: CreateEvaluationWbsAssignmentData, manager?: EntityManager): Promise<void>;
}
