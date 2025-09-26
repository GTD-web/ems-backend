import { EntityManager } from 'typeorm';
import type { IWbsSelfEvaluation } from './wbs-self-evaluation.interface';
import type {
  CreateWbsSelfEvaluationDto,
  UpdateWbsSelfEvaluationDto,
  WbsSelfEvaluationFilter,
  WbsSelfEvaluationStatistics,
} from '../wbs-self-evaluation.types';

/**
 * WBS 자기평가 서비스 인터페이스
 */
export interface IWbsSelfEvaluationService {
  /**
   * ID로 WBS 자기평가를 조회한다
   */
  ID로조회한다(
    id: string,
    manager?: EntityManager,
  ): Promise<IWbsSelfEvaluation | null>;

  /**
   * 필터 조건으로 WBS 자기평가를 조회한다
   */
  필터조회한다(
    filter: WbsSelfEvaluationFilter,
    manager?: EntityManager,
  ): Promise<IWbsSelfEvaluation[]>;

  /**
   * WBS 자기평가를 생성한다
   */
  생성한다(
    createDto: CreateWbsSelfEvaluationDto,
    createdBy: string,
    manager?: EntityManager,
  ): Promise<IWbsSelfEvaluation>;

  /**
   * WBS 자기평가를 업데이트한다
   */
  업데이트한다(
    id: string,
    updateDto: UpdateWbsSelfEvaluationDto,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<IWbsSelfEvaluation>;

  /**
   * WBS 자기평가를 삭제한다
   */
  삭제한다(
    id: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * WBS 자기평가를 제출한다
   */
  제출한다(
    id: string,
    submittedBy: string,
    manager?: EntityManager,
  ): Promise<IWbsSelfEvaluation>;
}
