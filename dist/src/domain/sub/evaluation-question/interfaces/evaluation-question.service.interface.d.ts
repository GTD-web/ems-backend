import { EntityManager } from 'typeorm';
import type { IEvaluationQuestion } from './evaluation-question.interface';
import type { CreateEvaluationQuestionDto, UpdateEvaluationQuestionDto, EvaluationQuestionFilter } from '../evaluation-question.types';
export interface IEvaluationQuestionService {
    ID로조회한다(id: string, manager?: EntityManager): Promise<IEvaluationQuestion | null>;
    질문내용으로조회한다(text: string, manager?: EntityManager): Promise<IEvaluationQuestion | null>;
    전체조회한다(manager?: EntityManager): Promise<IEvaluationQuestion[]>;
    필터조회한다(filter: EvaluationQuestionFilter, manager?: EntityManager): Promise<IEvaluationQuestion[]>;
    생성한다(createDto: CreateEvaluationQuestionDto, createdBy: string, manager?: EntityManager): Promise<IEvaluationQuestion>;
    업데이트한다(id: string, updateDto: UpdateEvaluationQuestionDto, updatedBy: string, manager?: EntityManager): Promise<IEvaluationQuestion>;
    삭제한다(id: string, deletedBy: string, manager?: EntityManager): Promise<void>;
    복사한다(id: string, copiedBy: string, manager?: EntityManager): Promise<IEvaluationQuestion>;
    질문내용중복확인한다(text: string, excludeId?: string, manager?: EntityManager): Promise<boolean>;
    질문응답존재확인한다(questionId: string, manager?: EntityManager): Promise<boolean>;
    질문응답개수조회한다(questionId: string, manager?: EntityManager): Promise<number>;
}
