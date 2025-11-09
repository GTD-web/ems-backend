import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { EntityManager, Repository } from 'typeorm';
import { EvaluationLine } from './evaluation-line.entity';
import { CreateEvaluationLineDto, UpdateEvaluationLineDto } from './evaluation-line.types';
export declare class EvaluationLineValidationService {
    private readonly evaluationLineRepository;
    private readonly transactionManager;
    private readonly logger;
    constructor(evaluationLineRepository: Repository<EvaluationLine>, transactionManager: TransactionManagerService);
    생성데이터검증한다(createData: CreateEvaluationLineDto, manager?: EntityManager): Promise<void>;
    업데이트데이터검증한다(id: string, updateData: UpdateEvaluationLineDto, manager?: EntityManager): Promise<void>;
    private 필수데이터검증한다;
    private 데이터형식검증한다;
    private 업데이트데이터형식검증한다;
    private 비즈니스규칙검증한다;
    private 중복검증한다;
    private 순서중복검증한다;
    평가라인존재확인한다(id: string, manager?: EntityManager): Promise<boolean>;
}
