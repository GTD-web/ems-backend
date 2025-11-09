import { EntityManager } from 'typeorm';
import type { EvaluationLineFilter, CreateEvaluationLineDto, UpdateEvaluationLineDto } from '../evaluation-line.types';
import type { IEvaluationLine } from './evaluation-line.interface';
export interface IEvaluationLineService {
    ID로_조회한다(id: string, manager?: EntityManager): Promise<IEvaluationLine | null>;
    전체_조회한다(manager?: EntityManager): Promise<IEvaluationLine[]>;
    필터_조회한다(filter: EvaluationLineFilter, manager?: EntityManager): Promise<IEvaluationLine[]>;
    생성한다(createData: CreateEvaluationLineDto, manager?: EntityManager): Promise<IEvaluationLine>;
    업데이트한다(id: string, updateData: UpdateEvaluationLineDto, updatedBy: string, manager?: EntityManager): Promise<IEvaluationLine>;
    삭제한다(id: string, deletedBy: string, manager?: EntityManager): Promise<void>;
    순서_중복_확인한다(order: number, excludeId?: string, manager?: EntityManager): Promise<boolean>;
    다음_순서_조회한다(manager?: EntityManager): Promise<number>;
}
