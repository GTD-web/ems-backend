import { EntityManager } from 'typeorm';
import type { IWbsSelfEvaluationMapping } from './wbs-self-evaluation-mapping.interface';
import type {
  CreateWbsSelfEvaluationMappingData,
  UpdateWbsSelfEvaluationMappingData,
  WbsSelfEvaluationMappingFilter,
} from '../wbs-self-evaluation-mapping.types';

/**
 * WBS 자기평가 맵핑 서비스 인터페이스
 */
export interface IWbsSelfEvaluationMappingService {
  /**
   * ID로 WBS 자기평가 맵핑을 조회한다
   */
  ID로조회한다(
    id: string,
    manager?: EntityManager,
  ): Promise<IWbsSelfEvaluationMapping | null>;

  /**
   * 프로젝트별 WBS 자기평가 맵핑을 조회한다
   */
  프로젝트별조회한다(
    projectId: string,
    manager?: EntityManager,
  ): Promise<IWbsSelfEvaluationMapping[]>;

  /**
   * 직원별 WBS 자기평가 맵핑을 조회한다
   */
  직원별조회한다(
    employeeId: string,
    manager?: EntityManager,
  ): Promise<IWbsSelfEvaluationMapping[]>;

  /**
   * WBS 항목별 자기평가 맵핑을 조회한다
   */
  WBS항목별조회한다(
    wbsItemId: string,
    manager?: EntityManager,
  ): Promise<IWbsSelfEvaluationMapping[]>;

  /**
   * 평가 기간별 WBS 자기평가 맵핑을 조회한다
   */
  평가기간별조회한다(
    periodId: string,
    manager?: EntityManager,
  ): Promise<IWbsSelfEvaluationMapping[]>;

  /**
   * 필터 조건으로 WBS 자기평가 맵핑을 조회한다
   */
  필터조회한다(
    filter: WbsSelfEvaluationMappingFilter,
    manager?: EntityManager,
  ): Promise<IWbsSelfEvaluationMapping[]>;

  /**
   * WBS 자기평가 맵핑을 생성한다
   */
  생성한다(
    createData: CreateWbsSelfEvaluationMappingData,
    createdBy: string,
    manager?: EntityManager,
  ): Promise<IWbsSelfEvaluationMapping>;

  /**
   * WBS 자기평가 맵핑을 업데이트한다
   */
  업데이트한다(
    id: string,
    updateData: UpdateWbsSelfEvaluationMappingData,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<IWbsSelfEvaluationMapping>;

  /**
   * WBS 자기평가 맵핑을 삭제한다
   */
  삭제한다(
    id: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * 중복 WBS 자기평가 맵핑을 확인한다
   */
  중복맵핑확인한다(
    projectId: string,
    employeeId: string,
    wbsItemId: string,
    periodId: string,
    excludeId?: string,
    manager?: EntityManager,
  ): Promise<boolean>;
}
