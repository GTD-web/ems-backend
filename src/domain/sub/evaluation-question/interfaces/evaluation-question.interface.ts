import { IBaseEntity } from '@libs/database/base/base.entity';
import { EvaluationQuestionType } from '../evaluation-question.types';

/**
 * 평가 질문 인터페이스
 * 평가에 사용되는 질문을 관리하는 인터페이스입니다.
 */
export interface IEvaluationQuestion extends IBaseEntity {
  /** 질문 그룹 ID */
  groupId: string;
  /** 질문 내용 */
  text: string;
  /** 질문 유형 */
  type: EvaluationQuestionType;
  /** 최소 점수 */
  minScore?: number;
  /** 최대 점수 */
  maxScore?: number;
  /** 신규 질문 여부 */
  isNewQuestion: boolean;
  /** 그룹 포함 여부 */
  includeInGroup: boolean;

  /**
   * 질문 내용을 업데이트한다
   * @param text 새로운 질문 내용
   * @param updatedBy 수정자 ID
   */
  질문내용업데이트한다(text: string, updatedBy: string): void;

  /**
   * 질문 유형을 변경한다
   * @param type 새로운 질문 유형
   * @param updatedBy 수정자 ID
   */
  질문유형변경한다(type: EvaluationQuestionType, updatedBy: string): void;

  /**
   * 점수 범위를 설정한다
   * @param minScore 최소 점수
   * @param maxScore 최대 점수
   * @param updatedBy 수정자 ID
   */
  점수범위설정한다(minScore: number, maxScore: number, updatedBy: string): void;

  /**
   * 신규 질문 여부를 설정한다
   * @param isNewQuestion 신규 질문 여부
   * @param updatedBy 수정자 ID
   */
  신규질문여부설정한다(isNewQuestion: boolean, updatedBy: string): void;

  /**
   * 그룹 포함 여부를 설정한다
   * @param includeInGroup 그룹 포함 여부
   * @param updatedBy 수정자 ID
   */
  그룹포함여부설정한다(includeInGroup: boolean, updatedBy: string): void;

  /**
   * 질문 그룹을 변경한다
   * @param groupId 새로운 그룹 ID
   * @param updatedBy 수정자 ID
   */
  질문그룹변경한다(groupId: string, updatedBy: string): void;

  /**
   * 질문이 점수형인지 확인한다
   * @returns 점수형 여부
   */
  점수형질문인가(): boolean;

  /**
   * 질문이 설문형인지 확인한다
   * @returns 설문형 여부
   */
  설문형질문인가(): boolean;

  /**
   * 질문이 혼합형인지 확인한다
   * @returns 혼합형 여부
   */
  혼합형질문인가(): boolean;

  /**
   * 점수 범위가 유효한지 확인한다
   * @returns 유효성 여부
   */
  점수범위유효한가(): boolean;

  /**
   * 질문 내용이 유효한지 확인한다
   * @returns 유효성 여부
   */
  질문내용유효한가(): boolean;

  /**
   * 특정 그룹에 속하는지 확인한다
   * @param groupId 확인할 그룹 ID
   * @returns 그룹 일치 여부
   */
  그룹일치하는가(groupId: string): boolean;
}
