import type {
  EvaluatorType,
  EvaluationLineDto,
} from '../evaluation-line.types';
import { IBaseEntity } from '@libs/database/base/base.entity';

/**
 * 평가 라인 인터페이스 (MVP 버전)
 * 평가 체계에서 평가자의 유형과 순서를 정의하는 인터페이스입니다.
 */
export interface IEvaluationLine extends IBaseEntity {
  /** 평가자 유형 */
  evaluatorType: EvaluatorType;
  /** 평가 순서 */
  order: number;
  /** 필수 평가자 여부 */
  isRequired: boolean;
  /** 자동 할당 여부 */
  isAutoAssigned: boolean;

  /**
   * DTO로 변환
   */
  DTO로_변환한다(): EvaluationLineDto;

  /**
   * 평가자 유형을 변경한다
   */
  평가자_유형을_변경한다(evaluatorType: EvaluatorType): void;

  /**
   * 평가 순서를 변경한다
   */
  평가_순서를_변경한다(order: number): void;

  /**
   * 필수 평가자 여부를 변경한다
   */
  필수_평가자_여부를_변경한다(isRequired: boolean): void;

  /**
   * 자동 할당 여부를 변경한다
   */
  자동_할당_여부를_변경한다(isAutoAssigned: boolean): void;

  /**
   * 평가 라인이 유효한지 검증한다
   */
  유효성을_검증한다(): boolean;
}
