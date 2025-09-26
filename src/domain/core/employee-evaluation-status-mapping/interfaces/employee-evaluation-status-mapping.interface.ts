import { IBaseEntity } from '@libs/database/base/base.entity';

/**
 * 평가 요소 타입
 */
export enum EvaluationElementType {
  WBS_ITEM = 'wbs_item',
}

/**
 * 직원 평가 상태 맵핑 인터페이스
 * 직원의 평가 상태와 WBS 항목 간의 관계를 정의합니다.
 */
export interface IEmployeeEvaluationStatusMapping extends IBaseEntity {
  /** 직원 ID - 평가를 받는 직원 식별자 */
  employeeId: string;
  /** 평가 기간 ID - 평가가 수행되는 평가 기간 */
  periodId: string;
  /** 직원 평가 상태 ID - 실제 평가 상태 엔티티 식별자 */
  evaluationStatusId: string;
  /** 평가 요소 타입 (WBS 항목) */
  elementType: EvaluationElementType;
  /** WBS 항목 ID - WBS 항목 식별자 */
  elementId: string;
  /** 평가자 ID - 평가를 수행하는 직원 식별자 (선택적) */
  evaluatorId?: string;
  /** 프로젝트 ID - WBS 항목이 속한 프로젝트 식별자 (선택적) */
  projectId?: string;

  // 매칭 확인 메서드
  /**
   * 특정 직원의 평가 상태 맵핑인지 확인한다
   * @param employeeId 확인할 직원 ID
   * @returns 직원 일치 여부
   */
  해당직원의평가상태인가(employeeId: string): boolean;

  /**
   * 평가 기간에 속하는지 확인한다
   * @param periodId 확인할 평가 기간 ID
   * @returns 평가 기간 일치 여부
   */
  평가기간일치하는가(periodId: string): boolean;

  /**
   * 특정 평가 요소 타입인지 확인한다
   * @param elementType 확인할 평가 요소 타입
   * @returns 평가 요소 타입 일치 여부
   */
  평가요소타입일치하는가(elementType: EvaluationElementType): boolean;

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
   * WBS 항목 요소인지 확인한다
   * @returns WBS 항목 여부
   */
  WBS항목요소인가(): boolean;
}
