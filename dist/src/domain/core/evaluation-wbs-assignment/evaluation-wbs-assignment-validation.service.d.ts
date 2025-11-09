import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { EntityManager, Repository } from 'typeorm';
import { EvaluationWbsAssignment } from './evaluation-wbs-assignment.entity';
import { CreateEvaluationWbsAssignmentData, UpdateEvaluationWbsAssignmentData } from './evaluation-wbs-assignment.types';
export declare class EvaluationWbsAssignmentValidationService {
    private readonly evaluationWbsAssignmentRepository;
    private readonly transactionManager;
    private readonly logger;
    constructor(evaluationWbsAssignmentRepository: Repository<EvaluationWbsAssignment>, transactionManager: TransactionManagerService);
    생성데이터검증한다(createData: CreateEvaluationWbsAssignmentData, manager?: EntityManager): Promise<void>;
    업데이트데이터검증한다(id: string, updateData: UpdateEvaluationWbsAssignmentData, manager?: EntityManager): Promise<void>;
    private 필수데이터검증한다;
    private 데이터형식검증한다;
    private ID형식검증한다;
    private 할당자형식검증한다;
    private 생성비즈니스규칙검증한다;
    private 업데이트비즈니스규칙검증한다;
    할당업데이트비즈니스규칙검증한다(id: string, updateData: UpdateEvaluationWbsAssignmentData, manager?: EntityManager): Promise<void>;
    할당삭제비즈니스규칙검증한다(assignment: any): Promise<void>;
    private 평가기간유효성검증한다;
    private 직원유효성검증한다;
    private 프로젝트유효성검증한다;
    private WBS항목유효성검증한다;
    private 할당자유효성검증한다;
}
