import { EntityManager } from 'typeorm';
import type { IEvaluationQuestion } from './evaluation-question.interface';
import type {
  CreateEvaluationQuestionDto,
  UpdateEvaluationQuestionDto,
  EvaluationQuestionFilter,
  EvaluationQuestionType,
} from '../evaluation-question.types';

/**
 * 평가 질문 서비스 인터페이스
 */
export interface IEvaluationQuestionService {
  /**
   * ID로 평가 질문을 조회한다
   */
  ID로조회한다(
    id: string,
    manager?: EntityManager,
  ): Promise<IEvaluationQuestion | null>;

  /**
   * 그룹별 평가 질문을 조회한다
   */
  그룹별조회한다(
    groupId: string,
    manager?: EntityManager,
  ): Promise<IEvaluationQuestion[]>;

  /**
   * 그룹과 질문 내용으로 평가 질문을 조회한다
   */
  그룹질문내용별조회한다(
    groupId: string,
    text: string,
    manager?: EntityManager,
  ): Promise<IEvaluationQuestion | null>;

  /**
   * 질문 유형별로 평가 질문을 조회한다
   */
  유형별조회한다(
    type: EvaluationQuestionType,
    manager?: EntityManager,
  ): Promise<IEvaluationQuestion[]>;

  /**
   * 신규 질문들을 조회한다
   */
  신규질문조회한다(manager?: EntityManager): Promise<IEvaluationQuestion[]>;

  /**
   * 그룹에 포함된 질문들을 조회한다
   */
  그룹포함질문조회한다(
    groupId: string,
    manager?: EntityManager,
  ): Promise<IEvaluationQuestion[]>;

  /**
   * 모든 평가 질문을 조회한다
   */
  전체조회한다(manager?: EntityManager): Promise<IEvaluationQuestion[]>;

  /**
   * 필터 조건으로 평가 질문을 조회한다
   */
  필터조회한다(
    filter: EvaluationQuestionFilter,
    manager?: EntityManager,
  ): Promise<IEvaluationQuestion[]>;

  /**
   * 평가 질문을 생성한다
   */
  생성한다(
    createDto: CreateEvaluationQuestionDto,
    createdBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationQuestion>;

  /**
   * 평가 질문을 업데이트한다
   */
  업데이트한다(
    id: string,
    updateDto: UpdateEvaluationQuestionDto,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationQuestion>;

  /**
   * 평가 질문을 삭제한다
   */
  삭제한다(
    id: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * 그룹의 모든 질문을 삭제한다
   */
  그룹질문전체삭제한다(
    groupId: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * 평가 질문을 복사한다
   */
  복사한다(
    id: string,
    newGroupId: string,
    copiedBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationQuestion>;

  /**
   * 그룹 내 질문 내용 중복을 확인한다
   */
  질문내용중복확인한다(
    groupId: string,
    text: string,
    excludeId?: string,
    manager?: EntityManager,
  ): Promise<boolean>;

  /**
   * 질문에 응답이 있는지 확인한다
   */
  질문응답존재확인한다(
    questionId: string,
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
   * 그룹의 질문 개수를 조회한다
   */
  그룹질문개수조회한다(
    groupId: string,
    manager?: EntityManager,
  ): Promise<number>;

  /**
   * 질문 유형별 개수를 조회한다
   */
  유형별개수조회한다(
    type: EvaluationQuestionType,
    manager?: EntityManager,
  ): Promise<number>;
}
