import type { IBaseEntity } from '@libs/database/base/base.entity';

/**
 * 동료평가 질문 매핑 인터페이스
 */
export interface IPeerEvaluationQuestionMapping extends IBaseEntity {
  /** 동료평가 ID */
  peerEvaluationId: string;
  /** 평가 질문 ID */
  questionId: string;
  /** 질문 그룹 ID (그룹 단위 추가 시 사용) */
  questionGroupId?: string;
  /** 표시 순서 */
  displayOrder: number;

  /**
   * 표시 순서를 변경한다
   */
  표시순서변경한다(displayOrder: number, updatedBy: string): void;

  /**
   * 동료평가 ID가 일치하는가
   */
  동료평가가_일치하는가(peerEvaluationId: string): boolean;

  /**
   * 질문 ID가 일치하는가
   */
  질문이_일치하는가(questionId: string): boolean;

  /**
   * 그룹 단위로 추가된 질문인지 확인한다
   */
  그룹단위로_추가되었는가(): boolean;

  /**
   * 질문 그룹이 일치하는가
   */
  질문그룹이_일치하는가(questionGroupId: string): boolean;
}
