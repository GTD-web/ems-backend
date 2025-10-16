import { IBaseEntity } from '@libs/database/base/base.entity';

/**
 * 평가 질문 인터페이스
 * 평가에 사용되는 질문을 관리하는 인터페이스입니다.
 * 질문은 QuestionGroupMapping을 통해 여러 그룹에 속할 수 있습니다.
 */
export interface IEvaluationQuestion extends IBaseEntity {
  /** 질문 내용 */
  text: string;
  /** 최소 점수 */
  minScore?: number;
  /** 최대 점수 */
  maxScore?: number;

  /**
   * 질문 내용을 업데이트한다
   * @param text 새로운 질문 내용
   * @param updatedBy 수정자 ID
   */
  질문내용업데이트한다(text: string, updatedBy: string): void;

  /**
   * 점수 범위를 설정한다
   * @param minScore 최소 점수
   * @param maxScore 최대 점수
   * @param updatedBy 수정자 ID
   */
  점수범위설정한다(minScore: number, maxScore: number, updatedBy: string): void;

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
}
