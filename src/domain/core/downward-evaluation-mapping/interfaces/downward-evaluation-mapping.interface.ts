import { IBaseEntity } from '@libs/database/base/base.entity';

/**
 * 하향평가 맵핑 인터페이스
 * 피평가자, 평가자, 프로젝트, 평가기간과 하향평가 간의 관계를 정의합니다.
 */
export interface IDownwardEvaluationMapping extends IBaseEntity {
  /** 피평가자 ID - 평가를 받는 직원 식별자 */
  employeeId: string;
  /** 평가자 ID - 평가를 수행하는 직원 식별자 */
  evaluatorId: string;
  /** 프로젝트 ID - 평가가 수행되는 프로젝트 식별자 */
  projectId: string;
  /** 평가 기간 ID - 평가가 수행되는 평가 기간 */
  periodId: string;
  /** 하향평가 ID - 실제 하향평가 엔티티 식별자 */
  downwardEvaluationId: string;
  /** 자기평가 ID - 연결된 자기평가 엔티티 식별자 (선택적) */
  selfEvaluationId?: string;

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
   * 프로젝트에 속하는지 확인한다
   * @param projectId 확인할 프로젝트 ID
   * @returns 프로젝트 소속 여부
   */
  프로젝트소속인가(projectId: string): boolean;

  /**
   * 평가 기간에 속하는지 확인한다
   * @param periodId 확인할 평가 기간 ID
   * @returns 평가 기간 일치 여부
   */
  평가기간일치하는가(periodId: string): boolean;

  /**
   * 자기평가가 연결되어 있는지 확인한다
   * @returns 자기평가 연결 여부
   */
  자기평가연결됨(): boolean;
}
