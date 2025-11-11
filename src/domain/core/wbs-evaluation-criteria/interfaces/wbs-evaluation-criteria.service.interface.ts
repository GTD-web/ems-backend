import { EntityManager } from 'typeorm';
import { IWbsEvaluationCriteria } from './wbs-evaluation-criteria.interface';
import {
  CreateWbsEvaluationCriteriaData,
  UpdateWbsEvaluationCriteriaData,
  WbsEvaluationCriteriaFilter,
} from '../wbs-evaluation-criteria.types';

/**
 * WBS 평가 기준 서비스 인터페이스
 * WBS 평가 기준 관련 비즈니스 로직을 정의합니다.
 */
export interface IWbsEvaluationCriteriaService {
  /**
   * ID로 WBS 평가 기준을 조회한다
   * @param id WBS 평가 기준 ID
   * @param manager 트랜잭션 매니저 (선택적)
   * @returns WBS 평가 기준 또는 null
   */
  ID로_조회한다(
    id: string,
    manager?: EntityManager,
  ): Promise<IWbsEvaluationCriteria | null>;

  /**
   * 모든 WBS 평가 기준을 조회한다
   * @param manager 트랜잭션 매니저 (선택적)
   * @returns WBS 평가 기준 목록
   */
  전체_조회한다(manager?: EntityManager): Promise<IWbsEvaluationCriteria[]>;

  /**
   * WBS 항목별 평가 기준을 조회한다
   * @param wbsItemId WBS 항목 ID
   * @param manager 트랜잭션 매니저 (선택적)
   * @returns WBS 평가 기준 목록
   */
  WBS항목별_조회한다(
    wbsItemId: string,
    manager?: EntityManager,
  ): Promise<IWbsEvaluationCriteria[]>;

  /**
   * 필터 조건으로 WBS 평가 기준을 조회한다
   * @param filter 필터 조건
   * @param manager 트랜잭션 매니저 (선택적)
   * @returns WBS 평가 기준 목록
   */
  필터_조회한다(
    filter: WbsEvaluationCriteriaFilter,
    manager?: EntityManager,
  ): Promise<IWbsEvaluationCriteria[]>;

  /**
   * WBS 평가 기준을 생성한다
   * @param createData 생성 데이터
   * @param manager 트랜잭션 매니저 (선택적)
   * @returns 생성된 WBS 평가 기준
   */
  생성한다(
    createData: CreateWbsEvaluationCriteriaData,
    manager?: EntityManager,
  ): Promise<IWbsEvaluationCriteria>;

  /**
   * WBS 평가 기준을 업데이트한다
   * @param id WBS 평가 기준 ID
   * @param updateData 업데이트 데이터
   * @param updatedBy 수정자 ID
   * @param manager 트랜잭션 매니저 (선택적)
   * @returns 업데이트된 WBS 평가 기준
   */
  업데이트한다(
    id: string,
    updateData: UpdateWbsEvaluationCriteriaData,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<IWbsEvaluationCriteria>;

  /**
   * WBS 평가 기준을 삭제한다
   * @param id WBS 평가 기준 ID
   * @param deletedBy 삭제자 ID
   * @param manager 트랜잭션 매니저 (선택적)
   */
  삭제한다(
    id: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * 특정 평가 기준이 존재하는지 확인한다
   * @param wbsItemId WBS 항목 ID
   * @param criteria 평가 기준 내용
   * @param manager 트랜잭션 매니저 (선택적)
   * @returns 존재 여부
   */
  평가기준_존재_확인한다(
    wbsItemId: string,
    criteria: string,
    manager?: EntityManager,
  ): Promise<boolean>;

  /**
   * WBS 항목의 모든 평가 기준을 삭제한다
   * @param wbsItemId WBS 항목 ID
   * @param deletedBy 삭제자 ID
   * @param manager 트랜잭션 매니저 (선택적)
   */
  WBS항목_평가기준_전체삭제한다(
    wbsItemId: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * 모든 WBS 평가 기준을 삭제한다
   * @param deletedBy 삭제자 ID
   * @param manager 트랜잭션 매니저 (선택적)
   */
  모든_평가기준을_삭제한다(
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;
}
