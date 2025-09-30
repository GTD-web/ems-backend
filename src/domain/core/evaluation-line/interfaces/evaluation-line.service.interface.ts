import { EntityManager } from 'typeorm';
import type {
  EvaluatorType,
  EvaluationLineFilter,
  CreateEvaluationLineDto,
  UpdateEvaluationLineDto,
} from '../evaluation-line.types';
import type { IEvaluationLine } from './evaluation-line.interface';

/**
 * 평가 라인 서비스 인터페이스 (MVP 버전)
 */
export interface IEvaluationLineService {
  /**
   * ID로 평가 라인을 조회한다
   */
  ID로_조회한다(
    id: string,
    manager?: EntityManager,
  ): Promise<IEvaluationLine | null>;

  /**
   * 모든 평가 라인을 조회한다
   */
  전체_조회한다(manager?: EntityManager): Promise<IEvaluationLine[]>;

  /**
   * 필터 조건으로 평가 라인을 조회한다
   */
  필터_조회한다(
    filter: EvaluationLineFilter,
    manager?: EntityManager,
  ): Promise<IEvaluationLine[]>;

  /**
   * 평가 라인을 생성한다
   */
  생성한다(
    createData: CreateEvaluationLineDto,
    manager?: EntityManager,
  ): Promise<IEvaluationLine>;

  /**
   * 평가 라인을 업데이트한다
   */
  업데이트한다(
    id: string,
    updateData: UpdateEvaluationLineDto,
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
   * 특정 순서의 평가 라인이 존재하는지 확인한다
   */
  순서_중복_확인한다(
    order: number,
    excludeId?: string,
    manager?: EntityManager,
  ): Promise<boolean>;

  /**
   * 다음 사용 가능한 순서를 조회한다
   */
  다음_순서_조회한다(manager?: EntityManager): Promise<number>;
}
