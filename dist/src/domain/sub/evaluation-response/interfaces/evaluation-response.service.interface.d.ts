import { EntityManager } from 'typeorm';
import type { IEvaluationResponse } from './evaluation-response.interface';
import type { CreateEvaluationResponseDto, UpdateEvaluationResponseDto, EvaluationResponseFilter, EvaluationResponseType, EvaluationResponseStats } from '../evaluation-response.types';
export interface IEvaluationResponseService {
    ID로조회한다(id: string, manager?: EntityManager): Promise<IEvaluationResponse | null>;
    질문별조회한다(questionId: string, manager?: EntityManager): Promise<IEvaluationResponse[]>;
    평가별조회한다(evaluationId: string, manager?: EntityManager): Promise<IEvaluationResponse[]>;
    질문평가별조회한다(questionId: string, evaluationId: string, manager?: EntityManager): Promise<IEvaluationResponse | null>;
    평가유형별조회한다(evaluationType: EvaluationResponseType, manager?: EntityManager): Promise<IEvaluationResponse[]>;
    평가유형조합조회한다(evaluationId: string, evaluationType: EvaluationResponseType, manager?: EntityManager): Promise<IEvaluationResponse[]>;
    전체조회한다(manager?: EntityManager): Promise<IEvaluationResponse[]>;
    필터조회한다(filter: EvaluationResponseFilter, manager?: EntityManager): Promise<IEvaluationResponse[]>;
    생성한다(createDto: CreateEvaluationResponseDto, createdBy: string, manager?: EntityManager): Promise<IEvaluationResponse>;
    업데이트한다(id: string, updateDto: UpdateEvaluationResponseDto, updatedBy: string, manager?: EntityManager): Promise<IEvaluationResponse>;
    삭제한다(id: string, deletedBy: string, manager?: EntityManager): Promise<void>;
    질문응답전체삭제한다(questionId: string, deletedBy: string, manager?: EntityManager): Promise<void>;
    평가응답전체삭제한다(evaluationId: string, deletedBy: string, manager?: EntityManager): Promise<void>;
    응답중복확인한다(questionId: string, evaluationId: string, manager?: EntityManager): Promise<boolean>;
    질문응답개수조회한다(questionId: string, manager?: EntityManager): Promise<number>;
    평가응답개수조회한다(evaluationId: string, manager?: EntityManager): Promise<number>;
    평가유형별응답개수조회한다(evaluationType: EvaluationResponseType, manager?: EntityManager): Promise<number>;
    질문응답통계조회한다(questionId: string, manager?: EntityManager): Promise<EvaluationResponseStats>;
    평가응답통계조회한다(evaluationId: string, manager?: EntityManager): Promise<EvaluationResponseStats>;
    평가유형별응답통계조회한다(evaluationType: EvaluationResponseType, manager?: EntityManager): Promise<EvaluationResponseStats>;
    평가완료율조회한다(evaluationId: string, manager?: EntityManager): Promise<number>;
    평가완료확인한다(evaluationId: string, manager?: EntityManager): Promise<boolean>;
}
