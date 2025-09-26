import { EntityManager } from 'typeorm';
import type { IDeliverableMapping } from './deliverable-mapping.interface';
import type {
  CreateDeliverableMappingData,
  UpdateDeliverableMappingData,
  DeliverableMappingFilter,
} from '../deliverable-mapping.types';

/**
 * 산출물 맵핑 서비스 인터페이스
 */
export interface IDeliverableMappingService {
  /**
   * ID로 산출물 맵핑을 조회한다
   */
  ID로조회한다(
    id: string,
    manager?: EntityManager,
  ): Promise<IDeliverableMapping | null>;

  /**
   * 직원별 산출물 맵핑을 조회한다
   */
  직원별조회한다(
    employeeId: string,
    manager?: EntityManager,
  ): Promise<IDeliverableMapping[]>;

  /**
   * WBS 항목별 산출물 맵핑을 조회한다
   */
  WBS항목별조회한다(
    wbsItemId: string,
    manager?: EntityManager,
  ): Promise<IDeliverableMapping[]>;

  /**
   * 필터 조건으로 산출물 맵핑을 조회한다
   */
  필터조회한다(
    filter: DeliverableMappingFilter,
    manager?: EntityManager,
  ): Promise<IDeliverableMapping[]>;

  /**
   * 산출물 맵핑을 생성한다
   */
  생성한다(
    createData: CreateDeliverableMappingData,
    createdBy: string,
    manager?: EntityManager,
  ): Promise<IDeliverableMapping>;

  /**
   * 산출물 맵핑을 업데이트한다
   */
  업데이트한다(
    id: string,
    updateData: UpdateDeliverableMappingData,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<IDeliverableMapping>;

  /**
   * 산출물 맵핑을 삭제한다
   */
  삭제한다(
    id: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * 중복 산출물 맵핑을 확인한다
   */
  중복맵핑확인한다(
    employeeId: string,
    wbsItemId: string,
    deliverableId: string,
    excludeId?: string,
    manager?: EntityManager,
  ): Promise<boolean>;
}
