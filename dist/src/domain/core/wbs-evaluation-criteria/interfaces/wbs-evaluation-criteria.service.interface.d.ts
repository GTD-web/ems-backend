import { EntityManager } from 'typeorm';
import { IWbsEvaluationCriteria } from './wbs-evaluation-criteria.interface';
import { CreateWbsEvaluationCriteriaData, UpdateWbsEvaluationCriteriaData, WbsEvaluationCriteriaFilter } from '../wbs-evaluation-criteria.types';
export interface IWbsEvaluationCriteriaService {
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
