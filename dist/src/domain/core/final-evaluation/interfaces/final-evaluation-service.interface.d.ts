import { EntityManager } from 'typeorm';
import type { IFinalEvaluation } from './final-evaluation.interface';
import type { CreateFinalEvaluationData, UpdateFinalEvaluationData } from '../final-evaluation.types';
export interface IFinalEvaluationService {
    생성한다(createData: CreateFinalEvaluationData, manager?: EntityManager): Promise<IFinalEvaluation>;
    수정한다(id: string, updateData: UpdateFinalEvaluationData, updatedBy: string, manager?: EntityManager): Promise<IFinalEvaluation>;
    삭제한다(id: string, deletedBy: string, manager?: EntityManager): Promise<void>;
    확정한다(id: string, confirmedBy: string, manager?: EntityManager): Promise<IFinalEvaluation>;
    확정_취소한다(id: string, updatedBy: string, manager?: EntityManager): Promise<IFinalEvaluation>;
    평가등급_변경한다(id: string, evaluationGrade: string, updatedBy: string, manager?: EntityManager): Promise<IFinalEvaluation>;
    직무등급_변경한다(id: string, jobGrade: string, updatedBy: string, manager?: EntityManager): Promise<IFinalEvaluation>;
    직무_상세등급_변경한다(id: string, jobDetailedGrade: string, updatedBy: string, manager?: EntityManager): Promise<IFinalEvaluation>;
}
