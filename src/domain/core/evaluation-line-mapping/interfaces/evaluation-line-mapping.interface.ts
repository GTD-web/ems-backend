import { IBaseEntity } from '@libs/database/base/base.entity';

/**
 * 평가 라인 맵핑 인터페이스
 * 피평가자, 평가자, 프로젝트와 평가 라인 간의 관계를 정의합니다.
 */
export interface IEvaluationLineMapping extends IBaseEntity {
  /** 피평가자 ID - 평가를 받는 직원 식별자 */
  employeeId: string;
  /** 평가자 ID - 평가를 수행하는 직원 식별자 */
  evaluatorId: string;
  /** 프로젝트 ID - 평가가 수행되는 프로젝트 식별자 (선택적) */
  projectId?: string;
  /** 평가 라인 ID - 실제 평가 라인 엔티티 식별자 */
  evaluationLineId: string;

  // 매칭 확인 메서드
  /**
   * 특정 피평가자의 평가 라인인지 확인한다
   * @param employeeId 확인할 피평가자 ID
   * @returns 피평가자 일치 여부
   */
  해당피평가자의평가라인인가(employeeId: string): boolean;

  /**
   * 특정 평가자의 평가 라인인지 확인한다
   * @param evaluatorId 확인할 평가자 ID
   * @returns 평가자 일치 여부
   */
  해당평가자의평가라인인가(evaluatorId: string): boolean;

  /**
   * 프로젝트에 속하는지 확인한다
   * @param projectId 확인할 프로젝트 ID
   * @returns 프로젝트 소속 여부
   */
  프로젝트소속인가(projectId: string): boolean;

  /**
   * 프로젝트가 연결되어 있는지 확인한다
   * @returns 프로젝트 연결 여부
   */
  프로젝트연결됨(): boolean;
}
