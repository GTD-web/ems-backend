import { EntityManager } from 'typeorm';
import type {
  EvaluationPeriodStatus,
  EvaluationPeriodPhase,
  EvaluationPeriodFilter,
  EvaluationPeriodStatistics,
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
  ID로조회한다(
    id: string,
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod | null>;

  /**
   * 이름으로 평가 기간을 조회한다
   */
  이름으로조회한다(
    name: string,
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod | null>;

  /**
   * 모든 평가 기간을 조회한다
   */
  전체조회한다(manager?: EntityManager): Promise<IEvaluationPeriod[]>;

  /**
   * 상태별 평가 기간을 조회한다
   */
  상태별조회한다(
    status: EvaluationPeriodStatus,
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod[]>;

  /**
   * 단계별 평가 기간을 조회한다
   */
  단계별조회한다(
    phase: EvaluationPeriodPhase,
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod[]>;

  /**
   * 활성화된 평가 기간을 조회한다
   */
  활성화된평가기간조회한다(
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod[]>;

  /**
   * 현재 진행중인 평가 기간을 조회한다
   */
  현재진행중평가기간조회한다(
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod | null>;

  /**
   * 완료된 평가 기간을 조회한다
   */
  완료된평가기간조회한다(manager?: EntityManager): Promise<IEvaluationPeriod[]>;

  /**
   * 필터 조건으로 평가 기간을 조회한다
   */
  필터조회한다(
    filter: EvaluationPeriodFilter,
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod[]>;

  /**
   * 평가 기간 통계를 조회한다
   */
  통계조회한다(manager?: EntityManager): Promise<EvaluationPeriodStatistics>;

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
  단계변경한다(
    id: string,
    targetPhase: EvaluationPeriodPhase,
    changedBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod>;

  /**
   * 수동 허용 설정을 변경한다
   */
  수동허용설정변경한다(
    id: string,
    criteriaSettingEnabled?: boolean,
    selfEvaluationSettingEnabled?: boolean,
    finalEvaluationSettingEnabled?: boolean,
    changedBy?: string,
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod>;

  /**
   * 평가 기간 이름 중복을 확인한다
   */
  이름중복확인한다(
    name: string,
    excludeId?: string,
    manager?: EntityManager,
  ): Promise<boolean>;

  /**
   * 기간 겹침을 확인한다
   */
  기간겹침확인한다(
    startDate: Date,
    endDate: Date,
    excludeId?: string,
    manager?: EntityManager,
  ): Promise<boolean>;

  /**
   * 현재 날짜 기준 활성 평가 기간이 있는지 확인한다
   */
  활성평가기간존재확인한다(manager?: EntityManager): Promise<boolean>;

  /**
   * 자기평가 달성률 최대값을 설정한다
   */
  자기평가달성률최대값설정한다(
    id: string,
    maxRate: number,
    setBy: string,
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod>;

  /**
   * 자기평가 달성률 최대값으로 평가 기간을 조회한다
   */
  자기평가달성률최대값별조회한다(
    minRate?: number,
    maxRate?: number,
    manager?: EntityManager,
  ): Promise<IEvaluationPeriod[]>;
}
