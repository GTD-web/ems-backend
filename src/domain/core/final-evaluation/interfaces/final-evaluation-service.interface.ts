import { EntityManager } from 'typeorm';
import type { IFinalEvaluation } from './final-evaluation.interface';
import type {
  CreateFinalEvaluationData,
  UpdateFinalEvaluationData,
} from '../final-evaluation.types';

/**
 * 최종평가 서비스 인터페이스
 * 최종평가 관련 비즈니스 로직을 정의하는 인터페이스입니다.
 *
 * 조회 기능은 별도의 QueryService에서 처리합니다.
 */
export interface IFinalEvaluationService {
  /**
   * 최종평가를 생성한다
   */
  생성한다(
    createData: CreateFinalEvaluationData,
    manager?: EntityManager,
  ): Promise<IFinalEvaluation>;

  /**
   * 최종평가를 수정한다
   */
  수정한다(
    id: string,
    updateData: UpdateFinalEvaluationData,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<IFinalEvaluation>;

  /**
   * 최종평가를 삭제한다
   */
  삭제한다(
    id: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * 최종평가를 확정한다
   */
  확정한다(
    id: string,
    confirmedBy: string,
    manager?: EntityManager,
  ): Promise<IFinalEvaluation>;

  /**
   * 최종평가 확정을 취소한다
   */
  확정_취소한다(
    id: string,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<IFinalEvaluation>;

  /**
   * 평가등급을 변경한다
   */
  평가등급_변경한다(
    id: string,
    evaluationGrade: string,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<IFinalEvaluation>;

  /**
   * 직무등급을 변경한다
   */
  직무등급_변경한다(
    id: string,
    jobGrade: string,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<IFinalEvaluation>;

  /**
   * 직무 상세등급을 변경한다
   */
  직무_상세등급_변경한다(
    id: string,
    jobDetailedGrade: string,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<IFinalEvaluation>;
}
