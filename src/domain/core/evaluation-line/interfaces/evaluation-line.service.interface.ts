import { EntityManager } from 'typeorm';
import type {
  EvaluatorType,
  EvaluationLineFilter,
  EvaluationLineStatistics,
  CreateEvaluationLineDto,
  UpdateEvaluationLineDto,
} from '../evaluation-line.types';
import type { IEvaluationLine } from './evaluation-line.interface';

/**
 * 평가 라인 서비스 인터페이스
 */
export interface IEvaluationLineService {
  /**
   * ID로 평가 라인을 조회한다
   */
  ID로조회한다(
    id: string,
    manager?: EntityManager,
  ): Promise<IEvaluationLine | null>;

  /**
   * 직원별 평가 라인을 조회한다
   */
  직원별조회한다(
    employeeId: string,
    manager?: EntityManager,
  ): Promise<IEvaluationLine[]>;

  /**
   * 평가자별 평가 라인을 조회한다
   */
  평가자별조회한다(
    evaluatorId: string,
    manager?: EntityManager,
  ): Promise<IEvaluationLine[]>;

  /**
   * 프로젝트별 평가 라인을 조회한다
   */
  프로젝트별조회한다(
    projectId: string,
    manager?: EntityManager,
  ): Promise<IEvaluationLine[]>;

  /**
   * 직원과 평가자로 평가 라인을 조회한다
   */
  직원평가자별조회한다(
    employeeId: string,
    evaluatorId: string,
    manager?: EntityManager,
  ): Promise<IEvaluationLine | null>;

  /**
   * 평가자 유형별 평가 라인을 조회한다
   */
  평가자유형별조회한다(
    evaluatorType: EvaluatorType,
    manager?: EntityManager,
  ): Promise<IEvaluationLine[]>;

  /**
   * 필수 평가자 라인을 조회한다
   */
  필수평가자조회한다(
    employeeId: string,
    manager?: EntityManager,
  ): Promise<IEvaluationLine[]>;

  /**
   * 자동 할당된 평가 라인을 조회한다
   */
  자동할당평가라인조회한다(manager?: EntityManager): Promise<IEvaluationLine[]>;

  /**
   * 필터 조건으로 평가 라인을 조회한다
   */
  필터조회한다(
    filter: EvaluationLineFilter,
    manager?: EntityManager,
  ): Promise<IEvaluationLine[]>;

  /**
   * 평가 라인 통계를 조회한다
   */
  통계조회한다(manager?: EntityManager): Promise<EvaluationLineStatistics>;

  /**
   * 평가 라인을 생성한다
   */
  생성한다(
    createDto: CreateEvaluationLineDto,
    createdBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationLine>;

  /**
   * 평가 라인을 업데이트한다
   */
  업데이트한다(
    id: string,
    updateDto: UpdateEvaluationLineDto,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationLine>;

  /**
   * 평가 라인을 삭제한다
   */
  삭제한다(
    id: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * 직원의 모든 평가 라인을 삭제한다
   */
  직원평가라인전체삭제한다(
    employeeId: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * 프로젝트의 모든 평가 라인을 삭제한다
   */
  프로젝트평가라인전체삭제한다(
    projectId: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * 평가자를 변경한다
   */
  평가자변경한다(
    id: string,
    evaluatorId: string,
    changedBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationLine>;

  /**
   * 평가 순서를 변경한다
   */
  순서변경한다(
    id: string,
    order: number,
    changedBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationLine>;

  /**
   * 중복 평가 라인을 확인한다
   */
  중복평가라인확인한다(
    employeeId: string,
    evaluatorId: string,
    evaluatorType: EvaluatorType,
    excludeId?: string,
    manager?: EntityManager,
  ): Promise<boolean>;

  /**
   * 자동 평가 라인을 생성한다
   */
  자동평가라인생성한다(
    employeeId: string,
    projectId: string,
    createdBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationLine[]>;

  /**
   * 직원의 평가 라인 완성도를 확인한다
   */
  평가라인완성도확인한다(
    employeeId: string,
    manager?: EntityManager,
  ): Promise<boolean>;

  /**
   * 평가자 권한을 확인한다
   */
  평가자권한확인한다(
    evaluatorId: string,
    employeeId: string,
    manager?: EntityManager,
  ): Promise<boolean>;
}
