import { IBaseEntity } from '@libs/database/base/base.entity';
import { EvaluationResponseType } from '../evaluation-response.types';

/**
 * 평가 응답 인터페이스
 * 평가 질문에 대한 응답을 관리하는 인터페이스입니다.
 */
export interface IEvaluationResponse extends IBaseEntity {
  /** 질문 ID */
  questionId: string;
  /** 평가 ID */
  evaluationId: string;
  /** 평가 유형 */
  evaluationType: EvaluationResponseType;
  /** 응답 내용 */
  answer?: string;
  /** 응답 점수 */
  score?: number;

  /**
   * 응답 내용을 업데이트한다
   * @param answer 새로운 응답 내용
   * @param updatedBy 수정자 ID
   */
  응답내용업데이트한다(answer: string, updatedBy: string): void;

  /**
   * 응답 점수를 업데이트한다
   * @param score 새로운 응답 점수
   * @param updatedBy 수정자 ID
   */
  응답점수업데이트한다(score: number, updatedBy: string): void;

  /**
   * 응답 내용과 점수를 함께 업데이트한다
   * @param answer 새로운 응답 내용
   * @param score 새로운 응답 점수
   * @param updatedBy 수정자 ID
   */
  응답전체업데이트한다(
    answer?: string,
    score?: number,
    updatedBy?: string,
  ): void;

  /**
   * 응답이 특정 질문에 대한 것인지 확인한다
   * @param questionId 확인할 질문 ID
   * @returns 질문 일치 여부
   */
  질문일치하는가(questionId: string): boolean;

  /**
   * 응답이 특정 평가에 대한 것인지 확인한다
   * @param evaluationId 확인할 평가 ID
   * @returns 평가 일치 여부
   */
  평가일치하는가(evaluationId: string): boolean;

  /**
   * 응답이 특정 평가 유형인지 확인한다
   * @param evaluationType 확인할 평가 유형
   * @returns 평가 유형 일치 여부
   */
  평가유형일치하는가(evaluationType: EvaluationResponseType): boolean;

  /**
   * 응답이 자기평가인지 확인한다
   * @returns 자기평가 여부
   */
  자기평가인가(): boolean;

  /**
   * 응답이 동료평가인지 확인한다
   * @returns 동료평가 여부
   */
  동료평가인가(): boolean;

  /**
   * 응답이 하향평가인지 확인한다
   * @returns 하향평가 여부
   */
  하향평가인가(): boolean;

  /**
   * 응답이 추가평가인지 확인한다
   * @returns 추가평가 여부
   */
  추가평가인가(): boolean;

  /**
   * 응답 내용이 있는지 확인한다
   * @returns 응답 내용 존재 여부
   */
  응답내용있는가(): boolean;

  /**
   * 응답 점수가 있는지 확인한다
   * @returns 응답 점수 존재 여부
   */
  응답점수있는가(): boolean;

  /**
   * 응답이 완전한지 확인한다 (내용 또는 점수가 있는지)
   * @returns 완전한 응답 여부
   */
  완전한응답인가(): boolean;

  /**
   * 응답 점수가 유효한 범위 내에 있는지 확인한다
   * @param minScore 최소 점수
   * @param maxScore 최대 점수
   * @returns 유효한 점수 여부
   */
  점수범위유효한가(minScore: number, maxScore: number): boolean;
}
