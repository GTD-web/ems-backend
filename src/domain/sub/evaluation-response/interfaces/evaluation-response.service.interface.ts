import { EntityManager } from 'typeorm';
import type { IEvaluationResponse } from './evaluation-response.interface';
import type {
  CreateEvaluationResponseDto,
  UpdateEvaluationResponseDto,
  EvaluationResponseFilter,
  EvaluationResponseType,
  EvaluationResponseStats,
} from '../evaluation-response.types';

/**
 * 평가 응답 서비스 인터페이스
 */
export interface IEvaluationResponseService {
  /**
   * ID로 평가 응답을 조회한다
   */
  ID로조회한다(
    id: string,
    manager?: EntityManager,
  ): Promise<IEvaluationResponse | null>;

  /**
   * 질문별 평가 응답을 조회한다
   */
  질문별조회한다(
    questionId: string,
    manager?: EntityManager,
  ): Promise<IEvaluationResponse[]>;

  /**
   * 평가별 응답을 조회한다
   */
  평가별조회한다(
    evaluationId: string,
    manager?: EntityManager,
  ): Promise<IEvaluationResponse[]>;

  /**
   * 질문과 평가로 응답을 조회한다
   */
  질문평가별조회한다(
    questionId: string,
    evaluationId: string,
    manager?: EntityManager,
  ): Promise<IEvaluationResponse | null>;

  /**
   * 평가 유형별 응답을 조회한다
   */
  평가유형별조회한다(
    evaluationType: EvaluationResponseType,
    manager?: EntityManager,
  ): Promise<IEvaluationResponse[]>;

  /**
   * 평가와 유형으로 응답을 조회한다
   */
  평가유형조합조회한다(
    evaluationId: string,
    evaluationType: EvaluationResponseType,
    manager?: EntityManager,
  ): Promise<IEvaluationResponse[]>;

  /**
   * 모든 평가 응답을 조회한다
   */
  전체조회한다(manager?: EntityManager): Promise<IEvaluationResponse[]>;

  /**
   * 필터 조건으로 평가 응답을 조회한다
   */
  필터조회한다(
    filter: EvaluationResponseFilter,
    manager?: EntityManager,
  ): Promise<IEvaluationResponse[]>;

  /**
   * 평가 응답을 생성한다
   */
  생성한다(
    createDto: CreateEvaluationResponseDto,
    createdBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationResponse>;

  /**
   * 평가 응답을 업데이트한다
   */
  업데이트한다(
    id: string,
    updateDto: UpdateEvaluationResponseDto,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationResponse>;

  /**
   * 평가 응답을 삭제한다
   */
  삭제한다(
    id: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * 질문의 모든 응답을 삭제한다
   */
  질문응답전체삭제한다(
    questionId: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * 평가의 모든 응답을 삭제한다
   */
  평가응답전체삭제한다(
    evaluationId: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * 질문과 평가 조합의 응답 중복을 확인한다
   */
  응답중복확인한다(
    questionId: string,
    evaluationId: string,
    manager?: EntityManager,
  ): Promise<boolean>;

  /**
   * 질문의 응답 개수를 조회한다
   */
  질문응답개수조회한다(
    questionId: string,
    manager?: EntityManager,
  ): Promise<number>;

  /**
   * 평가의 응답 개수를 조회한다
   */
  평가응답개수조회한다(
    evaluationId: string,
    manager?: EntityManager,
  ): Promise<number>;

  /**
   * 평가 유형별 응답 개수를 조회한다
   */
  평가유형별응답개수조회한다(
    evaluationType: EvaluationResponseType,
    manager?: EntityManager,
  ): Promise<number>;

  /**
   * 질문의 응답 통계를 조회한다
   */
  질문응답통계조회한다(
    questionId: string,
    manager?: EntityManager,
  ): Promise<EvaluationResponseStats>;

  /**
   * 평가의 응답 통계를 조회한다
   */
  평가응답통계조회한다(
    evaluationId: string,
    manager?: EntityManager,
  ): Promise<EvaluationResponseStats>;

  /**
   * 평가 유형별 응답 통계를 조회한다
   */
  평가유형별응답통계조회한다(
    evaluationType: EvaluationResponseType,
    manager?: EntityManager,
  ): Promise<EvaluationResponseStats>;

  /**
   * 평가의 완료율을 조회한다 (응답한 질문 수 / 전체 질문 수)
   */
  평가완료율조회한다(
    evaluationId: string,
    manager?: EntityManager,
  ): Promise<number>;

  /**
   * 평가가 완료되었는지 확인한다
   */
  평가완료확인한다(
    evaluationId: string,
    manager?: EntityManager,
  ): Promise<boolean>;
}
