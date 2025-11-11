import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { EntityManager, Repository } from 'typeorm';
import { FinalEvaluation } from './final-evaluation.entity';
import { CreateFinalEvaluationData, UpdateFinalEvaluationData } from './final-evaluation.types';
export declare class FinalEvaluationValidationService {
    private readonly finalEvaluationRepository;
    private readonly transactionManager;
    private readonly logger;
    constructor(finalEvaluationRepository: Repository<FinalEvaluation>, transactionManager: TransactionManagerService);
    생성데이터검증한다(createData: CreateFinalEvaluationData, manager?: EntityManager): Promise<void>;
    업데이트데이터검증한다(id: string, updateData: UpdateFinalEvaluationData, manager?: EntityManager): Promise<void>;
    private 필수데이터검증한다;
    private 데이터형식검증한다;
    private 업데이트데이터형식검증한다;
    private 비즈니스규칙검증한다;
    private 중복검증한다;
    private 확정된평가수정불가검증한다;
    최종평가존재확인한다(id: string, manager?: EntityManager): Promise<boolean>;
    직원과평가기간으로존재확인한다(employeeId: string, periodId: string, manager?: EntityManager): Promise<boolean>;
}
