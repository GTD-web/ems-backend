import { IBaseEntity } from '@libs/database/base/base.entity';

/**
 * WBS 자기평가 맵핑 인터페이스
 * WBS 항목과 직원 간의 자기평가 관계를 정의합니다.
 */
export interface IWbsSelfEvaluationMapping extends IBaseEntity {
  /** 프로젝트 ID - WBS 항목이 속한 프로젝트 식별자 */
  projectId: string;
  /** 직원 ID - 자기평가를 수행하는 직원 식별자 */
  employeeId: string;
  /** WBS 항목 ID - 자기평가 대상 WBS 항목 식별자 */
  wbsItemId: string;
  /** 평가 기간 ID - 자기평가가 수행되는 평가 기간 */
  periodId: string;
  /** 자기평가 ID - 실제 자기평가 엔티티 식별자 */
  selfEvaluationId: string;

  // 매칭 확인 메서드
  /**
   * 프로젝트에 속하는지 확인한다
   * @param projectId 확인할 프로젝트 ID
   * @returns 프로젝트 소속 여부
   */
  프로젝트소속인가(projectId: string): boolean;

  /**
   * 특정 직원의 자기평가인지 확인한다
   * @param employeeId 확인할 직원 ID
   * @returns 직원 일치 여부
   */
  해당직원의자기평가인가(employeeId: string): boolean;

  /**
   * WBS 항목 담당인지 확인한다
   * @param wbsItemId 확인할 WBS 항목 ID
   * @returns WBS 항목 담당 여부
   */
  WBS항목담당인가(wbsItemId: string): boolean;

  /**
   * 평가 기간에 속하는지 확인한다
   * @param periodId 확인할 평가 기간 ID
   * @returns 평가 기간 일치 여부
   */
  평가기간일치하는가(periodId: string): boolean;
}
