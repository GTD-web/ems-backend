import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { EvaluationProjectAssignmentValidationService } from './evaluation-project-assignment-validation.service';
import { EvaluationProjectAssignment } from './evaluation-project-assignment.entity';
import { CreateEvaluationProjectAssignmentData, UpdateEvaluationProjectAssignmentData, OrderDirection } from './evaluation-project-assignment.types';
import { IEvaluationProjectAssignment } from './interfaces/evaluation-project-assignment.interface';
import { IEvaluationProjectAssignmentService } from './interfaces/evaluation-project-assignment.service.interface';
export declare class EvaluationProjectAssignmentService implements IEvaluationProjectAssignmentService {
    private readonly evaluationProjectAssignmentRepository;
    private readonly dataSource;
    private readonly transactionManager;
    private readonly validationService;
    private readonly logger;
    constructor(evaluationProjectAssignmentRepository: Repository<EvaluationProjectAssignment>, dataSource: DataSource, transactionManager: TransactionManagerService, validationService: EvaluationProjectAssignmentValidationService);
    private executeSafeDomainOperation;
    ID로_조회한다(id: string, manager?: EntityManager): Promise<IEvaluationProjectAssignment | null>;
    생성한다(createData: CreateEvaluationProjectAssignmentData, manager?: EntityManager): Promise<IEvaluationProjectAssignment>;
    업데이트한다(id: string, updateData: UpdateEvaluationProjectAssignmentData, updatedBy: string, manager?: EntityManager): Promise<IEvaluationProjectAssignment>;
    삭제한다(id: string, deletedBy: string, manager?: EntityManager): Promise<void>;
    할당_존재_확인한다(periodId: string, employeeId: string, projectId: string, manager?: EntityManager): Promise<boolean>;
    평가기간_할당_전체삭제한다(periodId: string, deletedBy: string, manager?: EntityManager): Promise<void>;
    직원_할당_전체삭제한다(employeeId: string, deletedBy: string, manager?: EntityManager): Promise<void>;
    프로젝트_할당_전체삭제한다(projectId: string, deletedBy: string, manager?: EntityManager): Promise<void>;
    최대_순서를_조회한다(periodId: string, employeeId: string, manager?: EntityManager): Promise<number>;
    순서를_변경한다(assignmentId: string, direction: OrderDirection, updatedBy: string, manager?: EntityManager): Promise<IEvaluationProjectAssignment>;
    순서를_재정렬한다(periodId: string, employeeId: string, updatedBy: string, manager?: EntityManager): Promise<void>;
}
