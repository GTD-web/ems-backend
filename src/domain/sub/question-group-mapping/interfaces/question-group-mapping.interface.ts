import { IBaseEntity } from '@libs/database/base/base.entity';

/**
 * 질문 그룹 매핑 인터페이스
 * 평가 질문과 그룹의 N:M 관계를 관리하는 인터페이스입니다.
 * 하나의 질문이 여러 그룹에 속할 수 있습니다.
 */
export interface IQuestionGroupMapping extends IBaseEntity {
  /** 질문 그룹 ID */
  groupId: string;
  /** 평가 질문 ID */
  questionId: string;
  /** 표시 순서 */
  displayOrder: number;

  /**
   * 표시 순서를 변경한다
   * @param order 새로운 표시 순서
   * @param updatedBy 수정자 ID
   */
  표시순서변경한다(order: number, updatedBy: string): void;

  /**
   * 특정 그룹의 매핑인지 확인한다
   * @param groupId 확인할 그룹 ID
   * @returns 그룹 일치 여부
   */
  그룹일치하는가(groupId: string): boolean;

  /**
   * 특정 질문의 매핑인지 확인한다
   * @param questionId 확인할 질문 ID
   * @returns 질문 일치 여부
   */
  질문일치하는가(questionId: string): boolean;

  /**
   * 특정 그룹과 질문의 매핑인지 확인한다
   * @param groupId 확인할 그룹 ID
   * @param questionId 확인할 질문 ID
   * @returns 매핑 일치 여부
   */
  매핑일치하는가(groupId: string, questionId: string): boolean;
}

