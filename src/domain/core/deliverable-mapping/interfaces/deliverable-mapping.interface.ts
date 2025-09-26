import { IBaseEntity } from '@libs/database/base/base.entity';

/**
 * 산출물 맵핑 인터페이스
 * WBS 항목과 직원 간의 산출물 관계를 정의합니다.
 */
export interface IDeliverableMapping extends IBaseEntity {
  /** 직원 ID - 산출물을 제출하는 직원 식별자 */
  employeeId: string;
  /** WBS 항목 ID - 산출물이 속한 WBS 항목 식별자 */
  wbsItemId: string;
  /** 산출물 ID - 실제 산출물 엔티티 식별자 */
  deliverableId: string;

  // 매칭 확인 메서드
  /**
   * 특정 직원의 산출물인지 확인한다
   * @param employeeId 확인할 직원 ID
   * @returns 직원 일치 여부
   */
  해당직원의산출물인가(employeeId: string): boolean;

  /**
   * WBS 항목에 속하는지 확인한다
   * @param wbsItemId 확인할 WBS 항목 ID
   * @returns WBS 항목 소속 여부
   */
  WBS항목소속인가(wbsItemId: string): boolean;
}
