import { Repository, EntityManager } from 'typeorm';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { WbsSelfEvaluation } from './wbs-self-evaluation.entity';
import type { CreateWbsSelfEvaluationData, UpdateWbsSelfEvaluationData, WbsSelfEvaluationFilter } from './wbs-self-evaluation.types';
export declare class WbsSelfEvaluationService {
    private readonly wbsSelfEvaluationRepository;
    private readonly transactionManager;
    private readonly logger;
    constructor(wbsSelfEvaluationRepository: Repository<WbsSelfEvaluation>, transactionManager: TransactionManagerService);
    private executeSafeDomainOperation;
    생성한다(createData: CreateWbsSelfEvaluationData, manager?: EntityManager): Promise<WbsSelfEvaluation>;
    수정한다(id: string, updateData: UpdateWbsSelfEvaluationData, updatedBy: string, manager?: EntityManager): Promise<WbsSelfEvaluation>;
    피평가자가_1차평가자에게_제출한다(wbsSelfEvaluation: WbsSelfEvaluation, submittedBy: string, manager?: EntityManager): Promise<WbsSelfEvaluation>;
    피평가자가_1차평가자에게_제출한_것을_취소한다(id: string, resetBy: string, manager?: EntityManager): Promise<WbsSelfEvaluation>;
    삭제한다(id: string, deletedBy: string, manager?: EntityManager): Promise<void>;
    조회한다(id: string, manager?: EntityManager): Promise<WbsSelfEvaluation | null>;
    필터_조회한다(filter: WbsSelfEvaluationFilter, manager?: EntityManager): Promise<WbsSelfEvaluation[]>;
    평가기간별_조회한다(periodId: string, manager?: EntityManager): Promise<WbsSelfEvaluation[]>;
    직원별_조회한다(employeeId: string, manager?: EntityManager): Promise<WbsSelfEvaluation[]>;
    WBS항목별_조회한다(wbsItemId: string, manager?: EntityManager): Promise<WbsSelfEvaluation[]>;
    private 중복_검사를_수행한다;
    private 유효성을_검사한다;
    private 점수_유효성을_검사한다;
    내용을_초기화한다(evaluationId: string, updatedBy?: string, manager?: EntityManager): Promise<WbsSelfEvaluation>;
}
