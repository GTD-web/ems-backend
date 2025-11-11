import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { EntityManager, Repository } from 'typeorm';
import { WbsEvaluationCriteriaValidationService } from './wbs-evaluation-criteria-validation.service';
import { WbsEvaluationCriteria } from './wbs-evaluation-criteria.entity';
import { CreateWbsEvaluationCriteriaData, WbsEvaluationCriteriaFilter, UpdateWbsEvaluationCriteriaData } from './wbs-evaluation-criteria.types';
import { IWbsEvaluationCriteria } from './interfaces/wbs-evaluation-criteria.interface';
import { IWbsEvaluationCriteriaService } from './interfaces/wbs-evaluation-criteria.service.interface';
export declare class WbsEvaluationCriteriaService implements IWbsEvaluationCriteriaService {
    private readonly wbsEvaluationCriteriaRepository;
    private readonly transactionManager;
    private readonly validationService;
    private readonly logger;
    constructor(wbsEvaluationCriteriaRepository: Repository<WbsEvaluationCriteria>, transactionManager: TransactionManagerService, validationService: WbsEvaluationCriteriaValidationService);
    private executeSafeDomainOperation;
    ID로_조회한다(id: string, manager?: EntityManager): Promise<IWbsEvaluationCriteria | null>;
    전체_조회한다(manager?: EntityManager): Promise<IWbsEvaluationCriteria[]>;
    WBS항목별_조회한다(wbsItemId: string, manager?: EntityManager): Promise<IWbsEvaluationCriteria[]>;
    필터_조회한다(filter: WbsEvaluationCriteriaFilter, manager?: EntityManager): Promise<IWbsEvaluationCriteria[]>;
    생성한다(createData: CreateWbsEvaluationCriteriaData, manager?: EntityManager): Promise<IWbsEvaluationCriteria>;
    업데이트한다(id: string, updateData: UpdateWbsEvaluationCriteriaData, updatedBy: string, manager?: EntityManager): Promise<IWbsEvaluationCriteria>;
    삭제한다(id: string, deletedBy: string, manager?: EntityManager): Promise<void>;
    평가기준_존재_확인한다(wbsItemId: string, criteria: string, manager?: EntityManager): Promise<boolean>;
    WBS항목_평가기준_전체삭제한다(wbsItemId: string, deletedBy: string, manager?: EntityManager): Promise<void>;
    모든_평가기준을_삭제한다(deletedBy: string, manager?: EntityManager): Promise<void>;
}
