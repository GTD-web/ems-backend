import { EntityManager } from 'typeorm';
import type {
  EvaluationPeriodStatus,
  EvaluationPeriodPhase,
  EvaluationPeriodFilter,
  CreateEvaluationPeriodDto,
  UpdateEvaluationPeriodDto,
} from '../evaluation-period.types';
import type { IEvaluationPeriod } from './evaluation-period.interface';

/**
 * 평가 기간 서비스 인터페이스
 */
export interface IEvaluationPeriodService {
  /**
   * ID로 평가 기간을 조회한다
   */
  ID로_조회한다(
    id: string,
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod | null>;

  /**
   * 이름으로 평가 기간을 조회한다
   */
  이름으로_조회한다(
    name: string,
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod | null>;

  /**
   * 모든 평가 기간을 조회한다
   */
  전체_조회한다(manager?: EntityManager): Promise<IEvaluationPeriod[]>;

  /**
   * 상태별 평가 기간을 조회한다
   */
  상태별_조회한다(
    status: EvaluationPeriodStatus,
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod[]>;

  /**
   * 단계별 평가 기간을 조회한다
   */
  단계별_조회한다(
    phase: EvaluationPeriodPhase,
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod[]>;

  /**
   * 활성화된 평가 기간을 조회한다
   */
  활성화된_평가기간_조회한다(
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod[]>;

  /**
   * 현재 진행중인 평가 기간을 조회한다
   */
  현재_진행중_평가기간_조회한다(
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod | null>;

  /**
   * 완료된 평가 기간을 조회한다
   */
  완료된_평가기간_조회한다(
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod[]>;

  /**
   * 필터 조건으로 평가 기간을 조회한다
   */
  필터_조회한다(
    filter: EvaluationPeriodFilter,
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod[]>;

  /**
   * 평가 기간을 생성한다
   */
  생성한다(
    createDto: CreateEvaluationPeriodDto,
    createdBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod>;

  /**
   * 평가 기간을 업데이트한다
   */
  업데이트한다(
    id: string,
    updateDto: UpdateEvaluationPeriodDto,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod>;

  /**
   * 평가 기간을 삭제한다
   */
  삭제한다(
    id: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * 평가 기간을 시작한다
   */
  시작한다(
    id: string,
    startedBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod>;

  /**
   * 평가 기간을 완료한다
   */
  완료한다(
    id: string,
    completedBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod>;

  /**
   * 평가 기간 단계를 변경한다
   */
  단계_변경한다(
    id: string,
    targetPhase: EvaluationPeriodPhase,
    changedBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod>;

  /**
   * 수동 허용 설정을 변경한다
   */
  수동허용설정_변경한다(
    id: string,
    criteriaSettingEnabled?: boolean,
    selfEvaluationSettingEnabled?: boolean,
    finalEvaluationSettingEnabled?: boolean,
    changedBy?: string,
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod>;

  /**
   * 자기평가 달성률 최대값을 설정한다
   */
  자기평가_달성률최대값_설정한다(
    id: string,
    maxRate: number,
    setBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod>;
}
