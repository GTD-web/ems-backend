import { IBaseEntity } from '@libs/database/base/base.entity';

/**
 * WBS 자기평가 인터페이스
 * 실제 자기평가 데이터만을 관리하는 인터페이스입니다.
 * 자기평가와 WBS/직원/프로젝트 간의 관계는 별도의 맵핑 엔티티에서 관리됩니다.
 */
export interface IWbsSelfEvaluation extends IBaseEntity {
  /** 평가 내용 */
  evaluationContent?: string;
  /** 평가 점수 */
  score?: number;
  /** 평가일 */
  evaluationDate?: Date;
  /** 제출 여부 */
  isSubmitted: boolean;
  /** 제출일시 */
  submittedAt?: Date;

  /**
   * 평가 내용을 업데이트한다
   * @param content 새로운 평가 내용
   * @param updatedBy 수정자 ID
   */
  평가내용업데이트한다(content: string, updatedBy: string): void;

  /**
   * 평가 점수를 업데이트한다
   * @param score 새로운 평가 점수
   * @param updatedBy 수정자 ID
   */
  평가점수업데이트한다(score: number, updatedBy: string): void;

  /**
   * 평가를 완료한다
   * @param completedBy 완료한 사용자 ID
   */
  평가완료한다(completedBy: string): void;

  /**
   * 평가가 완료되었는지 확인한다
   * @returns 완료 여부
   */
  평가완료됨(): boolean;

  /**
   * 평가 점수가 유효한지 확인한다
   * @returns 유효성 여부
   */
  점수유효한가(): boolean;

  /**
   * 평가 내용이 있는지 확인한다
   * @returns 내용 존재 여부
   */
  평가내용있는가(): boolean;

  /**
   * 평가 수정이 가능한지 확인한다
   * @returns 수정 가능 여부
   */
  수정가능한가(): boolean;

  /**
   * 평가 점수 범위를 확인한다
   * @param minScore 최소 점수
   * @param maxScore 최대 점수
   * @returns 범위 내 여부
   */
  점수범위내인가(minScore: number, maxScore: number): boolean;

  /**
   * 자기평가가 제출 가능한 상태인지 확인한다
   * @returns 제출 가능 여부
   */
  제출가능한가(): boolean;

  /**
   * 자기평가를 제출한다
   * @param submittedBy 제출한 사용자 ID (본인이어야 함)
   */
  자기평가제출한다(submittedBy: string): void;

  /**
   * 자기평가가 제출되었는지 확인한다
   * @returns 제출 여부
   */
  제출완료됨(): boolean;
}
