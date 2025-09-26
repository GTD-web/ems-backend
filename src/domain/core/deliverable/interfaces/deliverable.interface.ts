import { IBaseEntity } from '@libs/database/base/base.entity';

/**
 * 산출물 타입
 */
export enum DeliverableType {
  URL = 'url',
  NAS = 'nas',
}

/**
 * 산출물 인터페이스
 * 실제 산출물 데이터만을 관리하는 인터페이스입니다.
 * 산출물과 WBS/직원/프로젝트 간의 관계는 별도의 맵핑 엔티티에서 관리됩니다.
 */
export interface IDeliverable extends IBaseEntity {
  /** 산출물 유형 */
  type: DeliverableType;
  /** 산출물 제목 */
  title: string;
  /** 산출물 경로 */
  path: string;

  /**
   * 산출물 정보를 업데이트한다
   * @param title 새로운 제목
   * @param path 새로운 경로
   * @param updatedBy 수정자 ID
   */
  정보업데이트한다(title?: string, path?: string, updatedBy?: string): void;

  /**
   * 산출물 타입을 변경한다
   * @param type 새로운 타입
   * @param changedBy 변경자 ID
   */
  타입변경한다(type: DeliverableType, changedBy: string): void;

  /**
   * 산출물이 URL 타입인지 확인한다
   * @returns URL 타입 여부
   */
  URL타입인가(): boolean;

  /**
   * 산출물이 NAS 타입인지 확인한다
   * @returns NAS 타입 여부
   */
  NAS타입인가(): boolean;

  /**
   * 산출물 경로가 유효한지 확인한다
   * @returns 유효성 여부
   */
  경로유효한가(): boolean;
}
