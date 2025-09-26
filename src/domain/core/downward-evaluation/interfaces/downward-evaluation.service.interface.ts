import { EntityManager } from 'typeorm';
import type {
  DownwardEvaluationType,
  DownwardEvaluationFilter,
  DownwardEvaluationStatistics,
  CreateDownwardEvaluationDto,
  UpdateDownwardEvaluationDto,
} from '../downward-evaluation.types';
import type { IDownwardEvaluation } from './downward-evaluation.interface';

/**
 * 하향 평가 서비스 인터페이스
 */
export interface IDownwardEvaluationService {
  /**
   * ID로 하향 평가를 조회한다
   */
  ID로조회한다(
    id: string,
    manager?: EntityManager,
  ): Promise<IDownwardEvaluation | null>;

  /**
   * 평가 유형별 하향 평가를 조회한다
   */
  평가유형별조회한다(
    evaluationType: DownwardEvaluationType,
    manager?: EntityManager,
  ): Promise<IDownwardEvaluation[]>;

  /**
   * 필터 조건으로 하향 평가를 조회한다
   */
  필터조회한다(
    filter: DownwardEvaluationFilter,
    manager?: EntityManager,
  ): Promise<IDownwardEvaluation[]>;

  /**
   * 하향 평가를 생성한다
   */
  생성한다(
    createDto: CreateDownwardEvaluationDto,
    createdBy: string,
    manager?: EntityManager,
  ): Promise<IDownwardEvaluation>;

  /**
   * 하향 평가를 업데이트한다
   */
  업데이트한다(
    id: string,
    updateDto: UpdateDownwardEvaluationDto,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<IDownwardEvaluation>;

  /**
   * 하향 평가를 삭제한다
   */
  삭제한다(
    id: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * 하향 평가를 완료한다
   */
  완료한다(
    id: string,
    completedBy: string,
    manager?: EntityManager,
  ): Promise<IDownwardEvaluation>;
}
