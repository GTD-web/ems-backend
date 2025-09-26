import { EntityManager } from 'typeorm';
import type {
  EvaluationCriteriaFilter,
  EvaluationCriteriaStatistics,
  CreateEvaluationCriteriaDto,
  UpdateEvaluationCriteriaDto,
} from '../evaluation-criteria.types';
import type { IEvaluationCriteria } from './evaluation-criteria.interface';

/**
 * 평가 기준 서비스 인터페이스
 */
export interface IEvaluationCriteriaService {
  /**
   * ID로 평가 기준을 조회한다
   */
  ID로조회한다(
    id: string,
    manager?: EntityManager,
  ): Promise<IEvaluationCriteria | null>;

  /**
   * 템플릿별 평가 기준을 조회한다
   */
  템플릿별조회한다(
    templateId: string,
    manager?: EntityManager,
  ): Promise<IEvaluationCriteria[]>;

  /**
   * 템플릿과 이름으로 평가 기준을 조회한다
   */
  템플릿이름별조회한다(
    templateId: string,
    name: string,
    manager?: EntityManager,
  ): Promise<IEvaluationCriteria | null>;

  /**
   * 모든 평가 기준을 조회한다
   */
  전체조회한다(manager?: EntityManager): Promise<IEvaluationCriteria[]>;

  /**
   * 가중치 범위별 평가 기준을 조회한다
   */
  가중치범위별조회한다(
    minWeight: number,
    maxWeight: number,
    manager?: EntityManager,
  ): Promise<IEvaluationCriteria[]>;

  /**
   * 필터 조건으로 평가 기준을 조회한다
   */
  필터조회한다(
    filter: EvaluationCriteriaFilter,
    manager?: EntityManager,
  ): Promise<IEvaluationCriteria[]>;

  /**
   * 평가 기준 통계를 조회한다
   */
  통계조회한다(
    templateId?: string,
    manager?: EntityManager,
  ): Promise<EvaluationCriteriaStatistics>;

  /**
   * 평가 기준을 생성한다
   */
  생성한다(
    createDto: CreateEvaluationCriteriaDto,
    createdBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationCriteria>;

  /**
   * 평가 기준을 업데이트한다
   */
  업데이트한다(
    id: string,
    updateDto: UpdateEvaluationCriteriaDto,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationCriteria>;

  /**
   * 평가 기준을 삭제한다
   */
  삭제한다(
    id: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * 템플릿의 모든 평가 기준을 삭제한다
   */
  템플릿평가기준전체삭제한다(
    templateId: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * 평가 기준을 복사한다
   */
  복사한다(
    id: string,
    newTemplateId: string,
    copiedBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationCriteria>;

  /**
   * 템플릿에 평가 기준 이름 중복을 확인한다
   */
  이름중복확인한다(
    templateId: string,
    name: string,
    excludeId?: string,
    manager?: EntityManager,
  ): Promise<boolean>;

  /**
   * 템플릿의 가중치 합계를 계산한다
   */
  템플릿가중치합계계산한다(
    templateId: string,
    excludeId?: string,
    manager?: EntityManager,
  ): Promise<number>;

  /**
   * 템플릿의 가중치 유효성을 검증한다
   */
  템플릿가중치유효성검증한다(
    templateId: string,
    manager?: EntityManager,
  ): Promise<boolean>;

  /**
   * 평가 기준 순서를 재정렬한다
   */
  순서재정렬한다(
    templateId: string,
    criteriaIds: string[],
    reorderedBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationCriteria[]>;
}
