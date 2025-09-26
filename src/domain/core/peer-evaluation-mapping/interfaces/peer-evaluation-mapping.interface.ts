import { IBaseEntity } from '@libs/database/base/base.entity';

/**
 * 동료평가 맵핑 인터페이스
 * 피평가자, 평가자, 평가기간과 동료평가 간의 관계를 정의합니다.
 */
export interface IPeerEvaluationMapping extends IBaseEntity {
  /** 피평가자 ID - 평가를 받는 직원 식별자 */
  employeeId: string;
  /** 평가자 ID - 평가를 수행하는 직원 식별자 */
  evaluatorId: string;
  /** 평가 기간 ID - 평가가 수행되는 평가 기간 */
  periodId: string;
  /** 동료평가 ID - 실제 동료평가 엔티티 식별자 */
  peerEvaluationId: string;

  // 매칭 확인 메서드
  /**
   * 특정 피평가자의 평가인지 확인한다
   * @param employeeId 확인할 피평가자 ID
   * @returns 피평가자 일치 여부
   */
  해당피평가자의평가인가(employeeId: string): boolean;

  /**
   * 특정 평가자의 평가인지 확인한다
   * @param evaluatorId 확인할 평가자 ID
   * @returns 평가자 일치 여부
   */
  해당평가자의평가인가(evaluatorId: string): boolean;

  /**
   * 평가 기간에 속하는지 확인한다
   * @param periodId 확인할 평가 기간 ID
   * @returns 평가 기간 일치 여부
   */
  평가기간일치하는가(periodId: string): boolean;

  /**
   * 자기 자신을 평가하는 맵핑인지 확인한다
   * @returns 자기 평가 여부
   */
  자기평가맵핑인가(): boolean;
}
