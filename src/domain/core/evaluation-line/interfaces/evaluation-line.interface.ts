import type {
  EvaluatorType,
  EvaluationLineDto,
} from '../evaluation-line.types';
import { IBaseEntity } from '@libs/database/base/base.entity';

/**
 * 평가 라인 인터페이스
 * 직원별 평가자 지정을 관리하는 인터페이스입니다.
 * 피평가자, 평가자, 프로젝트와의 관계는 별도의 맵핑 엔티티에서 관리됩니다.
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
   * 평가자 유형을 변경한다
   * @param evaluatorType 새로운 평가자 유형
   * @param changedBy 변경한 사용자 ID
   */
  평가자유형변경한다(evaluatorType: EvaluatorType, changedBy: string): void;

  /**
   * 평가 순서를 변경한다
   * @param order 새로운 순서
   * @param changedBy 변경한 사용자 ID
   */
  순서변경한다(order: number, changedBy: string): void;

  /**
   * 필수 평가자로 설정한다
   * @param setBy 설정한 사용자 ID
   */
  필수평가자로설정한다(setBy: string): void;

  /**
   * 필수 평가자 설정을 해제한다
   * @param unsetBy 해제한 사용자 ID
   */
  필수평가자설정해제한다(unsetBy: string): void;

  /**
   * 자동 할당으로 설정한다
   * @param setBy 설정한 사용자 ID
   */
  자동할당으로설정한다(setBy: string): void;

  /**
   * 수동 할당으로 설정한다
   * @param setBy 설정한 사용자 ID
   */
  수동할당으로설정한다(setBy: string): void;

  /**
   * 1차 평가자인지 확인한다
   * @returns 1차 평가자 여부
   */
  일차평가자인가(): boolean;

  /**
   * 2차 평가자인지 확인한다
   * @returns 2차 평가자 여부
   */
  이차평가자인가(): boolean;

  /**
   * 추가 평가자인지 확인한다
   * @returns 추가 평가자 여부
   */
  추가평가자인가(): boolean;

  /**
   * 필수 평가자인지 확인한다
   * @returns 필수 평가자 여부
   */
  필수평가자인가(): boolean;

  /**
   * 자동 할당된 평가자인지 확인한다
   * @returns 자동 할당 여부
   */
  자동할당됨(): boolean;

  /**
   * 평가 라인을 DTO로 변환한다
   * @returns 평가 라인 DTO 객체
   */
  DTO변환한다(): EvaluationLineDto;
}
