import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { EntityManager, Repository } from 'typeorm';
import { WbsEvaluationCriteria } from './wbs-evaluation-criteria.entity';
import { CreateWbsEvaluationCriteriaData, UpdateWbsEvaluationCriteriaData } from './wbs-evaluation-criteria.types';
export declare class WbsEvaluationCriteriaValidationService {
    private readonly wbsEvaluationCriteriaRepository;
    private readonly transactionManager;
    private readonly logger;
    constructor(wbsEvaluationCriteriaRepository: Repository<WbsEvaluationCriteria>, transactionManager: TransactionManagerService);
    생성데이터검증한다(createData: CreateWbsEvaluationCriteriaData, manager?: EntityManager): Promise<void>;
    업데이트데이터검증한다(id: string, updateData: UpdateWbsEvaluationCriteriaData, manager?: EntityManager): Promise<void>;
    private 필수데이터검증한다;
    private 데이터형식검증한다;
    private 업데이트데이터형식검증한다;
    private 비즈니스규칙검증한다;
    private 중복검증한다;
    private 업데이트중복검증한다;
    평가기준존재확인한다(id: string, manager?: EntityManager): Promise<boolean>;
    특정평가기준존재확인한다(wbsItemId: string, criteria: string, manager?: EntityManager): Promise<boolean>;
}
