import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { EntityManager, Repository } from 'typeorm';
import { EvaluationProjectAssignment } from './evaluation-project-assignment.entity';
import { CreateEvaluationProjectAssignmentData, UpdateEvaluationProjectAssignmentData } from './evaluation-project-assignment.types';
export declare class EvaluationProjectAssignmentValidationService {
    private readonly evaluationProjectAssignmentRepository;
    private readonly transactionManager;
    private readonly logger;
    constructor(evaluationProjectAssignmentRepository: Repository<EvaluationProjectAssignment>, transactionManager: TransactionManagerService);
    생성데이터검증한다(createData: CreateEvaluationProjectAssignmentData, manager?: EntityManager): Promise<void>;
    업데이트데이터검증한다(id: string, updateData: UpdateEvaluationProjectAssignmentData, manager?: EntityManager): Promise<void>;
    private 필수데이터검증한다;
    private 데이터형식검증한다;
    private ID형식검증한다;
    private 할당자형식검증한다;
    private 생성비즈니스규칙검증한다;
    private 업데이트비즈니스규칙검증한다;
    할당생성비즈니스규칙검증한다(createData: CreateEvaluationProjectAssignmentData, manager?: EntityManager): Promise<void>;
    할당업데이트비즈니스규칙검증한다(id: string, updateData: UpdateEvaluationProjectAssignmentData, manager?: EntityManager): Promise<void>;
    할당삭제비즈니스규칙검증한다(assignment: any): Promise<void>;
    private 중복할당검증한다;
    private 평가기간유효성검증한다;
    private 직원유효성검증한다;
    private 프로젝트유효성검증한다;
    private 할당자유효성검증한다;
}
