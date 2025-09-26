import { EntityManager } from 'typeorm';
import type { IDeliverable } from './deliverable.interface';
import type {
  CreateDeliverableDto,
  UpdateDeliverableDto,
  DeliverableFilter,
} from '../deliverable.types';

/**
 * 산출물 서비스 인터페이스
 */
export interface IDeliverableService {
  /**
   * ID로 산출물을 조회한다
   */
  ID로조회한다(
    id: string,
    manager?: EntityManager,
  ): Promise<IDeliverable | null>;

  /**
   * 필터 조건으로 산출물을 조회한다
   */
  필터조회한다(
    filter: DeliverableFilter,
    manager?: EntityManager,
  ): Promise<IDeliverable[]>;

  /**
   * 산출물을 생성한다
   */
  생성한다(
    createDto: CreateDeliverableDto,
    createdBy: string,
    manager?: EntityManager,
  ): Promise<IDeliverable>;

  /**
   * 산출물을 업데이트한다
   */
  업데이트한다(
    id: string,
    updateDto: UpdateDeliverableDto,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<IDeliverable>;

  /**
   * 산출물을 삭제한다
   */
  삭제한다(
    id: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;
}
