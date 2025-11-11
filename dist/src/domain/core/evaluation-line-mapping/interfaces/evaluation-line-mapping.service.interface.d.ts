import { EntityManager } from 'typeorm';
import type { IEvaluationLineMapping } from './evaluation-line-mapping.interface';
import type { CreateEvaluationLineMappingData, UpdateEvaluationLineMappingData, EvaluationLineMappingFilter } from '../evaluation-line-mapping.types';
export interface IEvaluationLineMappingService {
    ID로_조회한다(id: string, manager?: EntityManager): Promise<IEvaluationLineMapping | null>;
    전체_조회한다(manager?: EntityManager): Promise<IEvaluationLineMapping[]>;
    직원별_조회한다(employeeId: string, manager?: EntityManager): Promise<IEvaluationLineMapping[]>;
    평가자별_조회한다(evaluatorId: string, manager?: EntityManager): Promise<IEvaluationLineMapping[]>;
    WBS항목별_조회한다(wbsItemId: string, manager?: EntityManager): Promise<IEvaluationLineMapping[]>;
    필터_조회한다(filter: EvaluationLineMappingFilter, manager?: EntityManager): Promise<IEvaluationLineMapping[]>;
    생성한다(createData: CreateEvaluationLineMappingData, manager?: EntityManager): Promise<IEvaluationLineMapping>;
    업데이트한다(id: string, updateData: UpdateEvaluationLineMappingData, updatedBy: string, manager?: EntityManager): Promise<IEvaluationLineMapping>;
    삭제한다(id: string, deletedBy: string, manager?: EntityManager): Promise<void>;
    평가관계_존재_확인한다(evaluationPeriodId: string, employeeId: string, evaluatorId: string, wbsItemId?: string, manager?: EntityManager): Promise<boolean>;
    직원_맵핑_전체삭제한다(employeeId: string, deletedBy: string, manager?: EntityManager): Promise<void>;
    WBS항목_맵핑_전체삭제한다(wbsItemId: string, deletedBy: string, manager?: EntityManager): Promise<void>;
    모든_평가라인을_삭제한다(deletedBy: string, manager?: EntityManager): Promise<number>;
}
