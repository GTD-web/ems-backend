import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { EntityManager, Repository } from 'typeorm';
import { EvaluationLineMapping } from './evaluation-line-mapping.entity';
import { CreateEvaluationLineMappingData, UpdateEvaluationLineMappingData } from './evaluation-line-mapping.types';
export declare class EvaluationLineMappingValidationService {
    private readonly evaluationLineMappingRepository;
    private readonly transactionManager;
    private readonly logger;
    constructor(evaluationLineMappingRepository: Repository<EvaluationLineMapping>, transactionManager: TransactionManagerService);
    생성데이터검증한다(createData: CreateEvaluationLineMappingData, manager?: EntityManager): Promise<void>;
    업데이트데이터검증한다(id: string, updateData: UpdateEvaluationLineMappingData, manager?: EntityManager): Promise<void>;
    private 필수데이터검증한다;
    private 데이터형식검증한다;
    private 업데이트데이터형식검증한다;
    private 비즈니스규칙검증한다;
    private 중복검증한다;
    private 참조무결성검증한다;
    맵핑존재확인한다(id: string, manager?: EntityManager): Promise<boolean>;
    평가관계존재확인한다(employeeId: string, evaluatorId: string, wbsItemId?: string, manager?: EntityManager): Promise<boolean>;
}
