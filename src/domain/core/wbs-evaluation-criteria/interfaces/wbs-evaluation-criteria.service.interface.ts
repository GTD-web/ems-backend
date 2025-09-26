import { EntityManager } from 'typeorm';
import type { IWbsEvaluationCriteria } from './wbs-evaluation-criteria.interface';
import type {
  CreateWbsEvaluationCriteriaDto,
  UpdateWbsEvaluationCriteriaDto,
  WbsEvaluationCriteriaFilter,
} from '../wbs-evaluation-criteria.types';

/**
 * WBS 평가 기준 서비스 인터페이스
 */
export interface IWbsEvaluationCriteriaService {
  /**
   * ID로 WBS 평가 기준을 조회한다
   */
  ID로조회한다(
    id: string,
    manager?: EntityManager,
  ): Promise<IWbsEvaluationCriteria | null>;

  /**
   * WBS 항목별 평가 기준을 조회한다
   */
  WBS항목별조회한다(
    wbsItemId: string,
    manager?: EntityManager,
  ): Promise<IWbsEvaluationCriteria[]>;

  /**
   * WBS 항목과 기준 내용으로 평가 기준을 조회한다
   */
  WBS항목기준별조회한다(
    wbsItemId: string,
    criteria: string,
    manager?: EntityManager,
  ): Promise<IWbsEvaluationCriteria | null>;

  /**
   * 모든 WBS 평가 기준을 조회한다
   */
  전체조회한다(manager?: EntityManager): Promise<IWbsEvaluationCriteria[]>;

  /**
   * 필터 조건으로 WBS 평가 기준을 조회한다
   */
  필터조회한다(
    filter: WbsEvaluationCriteriaFilter,
    manager?: EntityManager,
  ): Promise<IWbsEvaluationCriteria[]>;

  /**
   * WBS 평가 기준을 생성한다
   */
  생성한다(
    createDto: CreateWbsEvaluationCriteriaDto,
    createdBy: string,
    manager?: EntityManager,
  ): Promise<IWbsEvaluationCriteria>;

  /**
   * WBS 평가 기준을 업데이트한다
   */
  업데이트한다(
    id: string,
    updateDto: UpdateWbsEvaluationCriteriaDto,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<IWbsEvaluationCriteria>;

  /**
   * WBS 평가 기준을 삭제한다
   */
  삭제한다(
    id: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * WBS 항목의 모든 평가 기준을 삭제한다
   */
  WBS항목평가기준전체삭제한다(
    wbsItemId: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * WBS 평가 기준을 복사한다
   */
  복사한다(
    id: string,
    newWbsItemId: string,
    copiedBy: string,
    manager?: EntityManager,
  ): Promise<IWbsEvaluationCriteria>;

  /**
   * WBS 항목에 평가 기준 내용 중복을 확인한다
   */
  기준중복확인한다(
    wbsItemId: string,
    criteria: string,
    excludeId?: string,
    manager?: EntityManager,
  ): Promise<boolean>;

  /**
   * WBS 항목에 평가 기준이 있는지 확인한다
   */
  WBS항목평가기준존재확인한다(
    wbsItemId: string,
    manager?: EntityManager,
  ): Promise<boolean>;
}
