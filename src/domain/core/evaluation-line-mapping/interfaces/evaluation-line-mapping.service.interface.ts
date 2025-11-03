import { EntityManager } from 'typeorm';
import type { IEvaluationLineMapping } from './evaluation-line-mapping.interface';
import type {
  CreateEvaluationLineMappingData,
  UpdateEvaluationLineMappingData,
  EvaluationLineMappingFilter,
} from '../evaluation-line-mapping.types';

/**
 * 평가 라인 맵핑 서비스 인터페이스 (MVP 버전)
 */
export interface IEvaluationLineMappingService {
  /**
   * ID로 평가 라인 맵핑을 조회한다
   */
  ID로_조회한다(
    id: string,
    manager?: EntityManager,
  ): Promise<IEvaluationLineMapping | null>;

  /**
   * 모든 평가 라인 맵핑을 조회한다
   */
  전체_조회한다(manager?: EntityManager): Promise<IEvaluationLineMapping[]>;

  /**
   * 직원별 평가 라인 맵핑을 조회한다
   */
  직원별_조회한다(
    employeeId: string,
    manager?: EntityManager,
  ): Promise<IEvaluationLineMapping[]>;

  /**
   * 평가자별 평가 라인 맵핑을 조회한다
   */
  평가자별_조회한다(
    evaluatorId: string,
    manager?: EntityManager,
  ): Promise<IEvaluationLineMapping[]>;

  /**
   * WBS 항목별 평가 라인 맵핑을 조회한다
   */
  WBS항목별_조회한다(
    wbsItemId: string,
    manager?: EntityManager,
  ): Promise<IEvaluationLineMapping[]>;

  /**
   * 필터 조건으로 평가 라인 맵핑을 조회한다
   */
  필터_조회한다(
    filter: EvaluationLineMappingFilter,
    manager?: EntityManager,
  ): Promise<IEvaluationLineMapping[]>;

  /**
   * 평가 라인 맵핑을 생성한다
   */
  생성한다(
    createData: CreateEvaluationLineMappingData,
    manager?: EntityManager,
  ): Promise<IEvaluationLineMapping>;

  /**
   * 평가 라인 맵핑을 업데이트한다
   */
  업데이트한다(
    id: string,
    updateData: UpdateEvaluationLineMappingData,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationLineMapping>;

  /**
   * 평가 라인 맵핑을 삭제한다
   */
  삭제한다(
    id: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * 특정 평가 관계가 존재하는지 확인한다
   */
  평가관계_존재_확인한다(
    evaluationPeriodId: string,
    employeeId: string,
    evaluatorId: string,
    wbsItemId?: string,
    manager?: EntityManager,
  ): Promise<boolean>;

  /**
   * 직원의 모든 맵핑을 삭제한다
   */
  직원_맵핑_전체삭제한다(
    employeeId: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * WBS 항목의 모든 맵핑을 삭제한다
   */
  WBS항목_맵핑_전체삭제한다(
    wbsItemId: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;
}
