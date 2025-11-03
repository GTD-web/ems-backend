import { IBaseEntity } from '@libs/database/base/base.entity';

import { EvaluationLineMappingDto } from '../evaluation-line-mapping.types';

/**
 * 평가 라인 맵핑 인터페이스 (MVP 버전)
 * 실제 평가 관계(피평가자-평가자)를 평가 라인과 연결하는 인터페이스입니다.
 */
export interface IEvaluationLineMapping extends IBaseEntity {
  /** 평가기간 ID - 평가가 수행되는 평가기간 식별자 */
  evaluationPeriodId: string;
  /** 피평가자 ID - 평가를 받는 직원 식별자 */
  employeeId: string;
  /** 평가자 ID - 평가를 수행하는 직원 식별자 */
  evaluatorId: string;
  /** WBS 항목 ID - 평가가 수행되는 WBS 항목 식별자 (선택적) */
  wbsItemId?: string;
  /** 평가 라인 ID - 실제 평가 라인 엔티티 식별자 */
  evaluationLineId: string;

  /**
   * DTO로 변환
   */
  DTO로_변환한다(): EvaluationLineMappingDto;

  /**
   * 평가자를 변경한다
   */
  평가자를_변경한다(evaluatorId: string): void;

  /**
   * 평가 라인을 변경한다
   */
  평가라인을_변경한다(evaluationLineId: string): void;

  /**
   * WBS 항목을 변경한다
   */
  WBS항목을_변경한다(wbsItemId?: string): void;

  /**
   * 맵핑이 유효한지 검증한다
   */
  유효성을_검증한다(): boolean;

  /**
   * WBS 기반 평가인지 확인한다
   */
  WBS_기반_평가인가(): boolean;

  /**
   * 동일한 평가 관계인지 확인한다
   */
  동일한_평가관계인가(
    evaluationPeriodId: string,
    employeeId: string,
    evaluatorId: string,
    wbsItemId?: string,
  ): boolean;
}
