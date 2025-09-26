import { EntityManager } from 'typeorm';
import type {
  IEmployeeEvaluationStatusMapping,
  EvaluationElementType,
} from './employee-evaluation-status-mapping.interface';
import type {
  CreateEmployeeEvaluationStatusMappingData,
  UpdateEmployeeEvaluationStatusMappingData,
  EmployeeEvaluationStatusMappingFilter,
  EmployeeEvaluationStatusMappingStatistics,
  EvaluationElementSummary,
} from '../employee-evaluation-status-mapping.types';

/**
 * 직원 평가 상태 맵핑 서비스 인터페이스
 */
export interface IEmployeeEvaluationStatusMappingService {
  /**
   * ID로 직원 평가 상태 맵핑을 조회한다
   */
  ID로조회한다(
    id: string,
    manager?: EntityManager,
  ): Promise<IEmployeeEvaluationStatusMapping | null>;

  /**
   * 직원별 평가 상태 맵핑을 조회한다
   */
  직원별조회한다(
    employeeId: string,
    manager?: EntityManager,
  ): Promise<IEmployeeEvaluationStatusMapping[]>;

  /**
   * 평가 기간별 평가 상태 맵핑을 조회한다
   */
  평가기간별조회한다(
    periodId: string,
    manager?: EntityManager,
  ): Promise<IEmployeeEvaluationStatusMapping[]>;

  /**
   * 평가 상태별 맵핑을 조회한다
   */
  평가상태별조회한다(
    evaluationStatusId: string,
    manager?: EntityManager,
  ): Promise<IEmployeeEvaluationStatusMapping[]>;

  /**
   * 평가 요소 타입별 맵핑을 조회한다
   */
  평가요소타입별조회한다(
    elementType: EvaluationElementType,
    manager?: EntityManager,
  ): Promise<IEmployeeEvaluationStatusMapping[]>;

  /**
   * 평가자별 맵핑을 조회한다
   */
  평가자별조회한다(
    evaluatorId: string,
    manager?: EntityManager,
  ): Promise<IEmployeeEvaluationStatusMapping[]>;

  /**
   * 프로젝트별 맵핑을 조회한다
   */
  프로젝트별조회한다(
    projectId: string,
    manager?: EntityManager,
  ): Promise<IEmployeeEvaluationStatusMapping[]>;

  /**
   * 직원과 평가 기간으로 맵핑을 조회한다
   */
  직원평가기간별조회한다(
    employeeId: string,
    periodId: string,
    manager?: EntityManager,
  ): Promise<IEmployeeEvaluationStatusMapping[]>;

  /**
   * 필터 조건으로 평가 상태 맵핑을 조회한다
   */
  필터조회한다(
    filter: EmployeeEvaluationStatusMappingFilter,
    manager?: EntityManager,
  ): Promise<IEmployeeEvaluationStatusMapping[]>;

  /**
   * 직원 평가 상태 맵핑을 생성한다
   */
  생성한다(
    createData: CreateEmployeeEvaluationStatusMappingData,
    createdBy: string,
    manager?: EntityManager,
  ): Promise<IEmployeeEvaluationStatusMapping>;

  /**
   * 직원 평가 상태 맵핑을 업데이트한다
   */
  업데이트한다(
    id: string,
    updateData: UpdateEmployeeEvaluationStatusMappingData,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<IEmployeeEvaluationStatusMapping>;

  /**
   * 직원 평가 상태 맵핑을 삭제한다
   */
  삭제한다(
    id: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * 중복 맵핑을 확인한다
   */
  중복맵핑확인한다(
    employeeId: string,
    periodId: string,
    elementType: EvaluationElementType,
    elementId: string,
    excludeId?: string,
    manager?: EntityManager,
  ): Promise<boolean>;

  /**
   * 평가 요소별 집계 정보를 조회한다
   */
  평가요소별집계조회한다(
    employeeId: string,
    periodId: string,
    manager?: EntityManager,
  ): Promise<EvaluationElementSummary[]>;

  /**
   * 직원 평가 상태 맵핑 통계를 조회한다
   */
  통계조회한다(
    periodId?: string,
    manager?: EntityManager,
  ): Promise<EmployeeEvaluationStatusMappingStatistics>;

  /**
   * 평가 상태에 연결된 모든 맵핑을 삭제한다
   */
  평가상태맵핑전체삭제한다(
    evaluationStatusId: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * 평가 기간의 모든 맵핑을 삭제한다
   */
  평가기간맵핑전체삭제한다(
    periodId: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * 평가 요소 ID로 맵핑을 조회한다
   */
  평가요소ID로조회한다(
    elementId: string,
    elementType: EvaluationElementType,
    manager?: EntityManager,
  ): Promise<IEmployeeEvaluationStatusMapping[]>;

  /**
   * 평가 요소 맵핑을 일괄 생성한다
   */
  일괄생성한다(
    createDataList: CreateEmployeeEvaluationStatusMappingData[],
    createdBy: string,
    manager?: EntityManager,
  ): Promise<IEmployeeEvaluationStatusMapping[]>;
}
