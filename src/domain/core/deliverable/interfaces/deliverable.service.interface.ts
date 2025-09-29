import { EntityManager } from 'typeorm';
import type {
  DeliverableStatus,
  DeliverableType,
  DeliverableFilter,
  DeliverableStatistics,
  CreateDeliverableDto,
  UpdateDeliverableDto,
} from '../deliverable.types';
import type { IDeliverable } from './deliverable.interface';

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
   * WBS 항목별 산출물을 조회한다
   */
  WBS항목별조회한다(
    wbsItemId: string,
    manager?: EntityManager,
  ): Promise<IDeliverable[]>;

  /**
   * 상태별 산출물을 조회한다
   */
  상태별조회한다(
    status: DeliverableStatus,
    manager?: EntityManager,
  ): Promise<IDeliverable[]>;

  /**
   * 유형별 산출물을 조회한다
   */
  유형별조회한다(
    type: DeliverableType,
    manager?: EntityManager,
  ): Promise<IDeliverable[]>;

  /**
   * 완료된 산출물을 조회한다
   */
  완료산출물조회한다(manager?: EntityManager): Promise<IDeliverable[]>;

  /**
   * 진행중인 산출물을 조회한다
   */
  진행중산출물조회한다(manager?: EntityManager): Promise<IDeliverable[]>;

  /**
   * 지연된 산출물을 조회한다
   */
  지연산출물조회한다(manager?: EntityManager): Promise<IDeliverable[]>;

  /**
   * 필터 조건으로 산출물을 조회한다
   */
  필터조회한다(
    filter: DeliverableFilter,
    manager?: EntityManager,
  ): Promise<IDeliverable[]>;

  /**
   * 산출물 통계를 조회한다
   */
  통계조회한다(
    wbsItemId?: string,
    manager?: EntityManager,
  ): Promise<DeliverableStatistics>;

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

  /**
   * 산출물 작업을 시작한다
   */
  작업시작한다(
    id: string,
    startedBy: string,
    manager?: EntityManager,
  ): Promise<IDeliverable>;

  /**
   * 산출물을 완료한다
   */
  완료한다(
    id: string,
    completedBy: string,
    manager?: EntityManager,
  ): Promise<IDeliverable>;

  /**
   * 산출물을 거부한다
   */
  거부한다(
    id: string,
    rejectedBy: string,
    manager?: EntityManager,
  ): Promise<IDeliverable>;

  /**
   * WBS 항목의 모든 산출물을 삭제한다
   */
  WBS항목산출물전체삭제한다(
    wbsItemId: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<void>;

  /**
   * 산출물 이름 중복을 확인한다
   */
  이름중복확인한다(
    wbsItemId: string,
    name: string,
    excludeId?: string,
    manager?: EntityManager,
  ): Promise<boolean>;

  /**
   * 파일 정보를 업데이트한다
   */
  파일정보업데이트한다(
    id: string,
    filePath: string,
    fileSize: number,
    mimeType: string,
    updatedBy: string,
    manager?: EntityManager,
  ): Promise<IDeliverable>;

  /**
   * 파일을 삭제한다
   */
  파일삭제한다(
    id: string,
    deletedBy: string,
    manager?: EntityManager,
  ): Promise<IDeliverable>;

  /**
   * WBS 항목의 산출물 완료율을 계산한다
   */
  WBS항목완료율계산한다(
    wbsItemId: string,
    manager?: EntityManager,
  ): Promise<number>;

  /**
   * 산출물을 복사한다
   */
  복사한다(
    id: string,
    newWbsItemId: string,
    copiedBy: string,
    manager?: EntityManager,
  ): Promise<IDeliverable>;
}
