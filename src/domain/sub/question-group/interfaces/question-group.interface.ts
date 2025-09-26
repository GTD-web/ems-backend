import { IBaseEntity } from '@libs/database/base/base.entity';

/**
 * 질문 그룹 인터페이스
 * 평가 질문 그룹을 관리하는 인터페이스입니다.
 */
export interface IQuestionGroup extends IBaseEntity {
  /** 그룹명 */
  name: string;
  /** 기본 그룹 여부 */
  isDefault: boolean;
  /** 삭제 가능 여부 */
  isDeletable: boolean;

  /**
   * 그룹명을 업데이트한다
   * @param name 새로운 그룹명
   * @param updatedBy 수정자 ID
   */
  그룹명업데이트한다(name: string, updatedBy: string): void;

  /**
   * 기본 그룹 여부를 설정한다
   * @param isDefault 기본 그룹 여부
   * @param updatedBy 수정자 ID
   */
  기본그룹설정한다(isDefault: boolean, updatedBy: string): void;

  /**
   * 삭제 가능 여부를 설정한다
   * @param isDeletable 삭제 가능 여부
   * @param updatedBy 수정자 ID
   */
  삭제가능여부설정한다(isDeletable: boolean, updatedBy: string): void;

  /**
   * 그룹이 삭제 가능한지 확인한다
   * @returns 삭제 가능 여부
   */
  삭제가능한가(): boolean;

  /**
   * 그룹이 기본 그룹인지 확인한다
   * @returns 기본 그룹 여부
   */
  기본그룹인가(): boolean;

  /**
   * 그룹명이 유효한지 확인한다
   * @returns 유효성 여부
   */
  유효한그룹명인가(): boolean;
}
