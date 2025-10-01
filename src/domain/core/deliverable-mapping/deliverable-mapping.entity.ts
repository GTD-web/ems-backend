import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import { IDeliverableMapping } from './interfaces/deliverable-mapping.interface';
import type {
  DeliverableMappingDto,
  CreateDeliverableMappingData,
} from './deliverable-mapping.types';

/**
 * 산출물 매핑 엔티티
 * 직원과 산출물 간의 매핑을 관리합니다.
 */
@Entity('deliverable_mapping')
@Index(['employeeId'])
@Index(['wbsItemId'])
@Index(['deliverableId'])
@Index(['employeeId', 'wbsItemId'])
@Index(['employeeId', 'deliverableId'])
export class DeliverableMapping
  extends BaseEntity<DeliverableMappingDto>
  implements IDeliverableMapping
{
  @Column({
    type: 'uuid',
    comment: '직원 ID',
  })
  employeeId: string;

  @Column({
    type: 'uuid',
    comment: 'WBS 항목 ID',
  })
  wbsItemId: string;

  @Column({
    type: 'uuid',
    comment: '산출물 ID',
  })
  deliverableId: string;

  @Column({
    type: 'timestamp with time zone',
    comment: '매핑일',
  })
  mappedDate: Date;

  @Column({
    type: 'uuid',
    comment: '매핑자 ID',
  })
  mappedBy: string;

  @Column({
    type: 'boolean',
    default: false,
    comment: '활성 상태',
  })
  isActive: boolean;

  constructor(data?: CreateDeliverableMappingData) {
    super();
    if (data) {
      this.employeeId = data.employeeId;
      this.wbsItemId = data.wbsItemId;
      this.deliverableId = data.deliverableId;
      this.mappedBy = data.mappedBy;
      this.mappedDate = new Date();
      this.isActive = true;

      // 감사 정보 설정
      this.메타데이터를_업데이트한다(data.mappedBy);
    }
  }

  /**
   * 특정 직원의 매핑인지 확인한다
   */
  해당_직원의_매핑인가(employeeId: string): boolean {
    return this.employeeId === employeeId;
  }

  /**
   * 특정 WBS 항목의 매핑인지 확인한다
   */
  해당_WBS항목의_매핑인가(wbsItemId: string): boolean {
    return this.wbsItemId === wbsItemId;
  }

  /**
   * 특정 산출물의 매핑인지 확인한다
   */
  해당_산출물의_매핑인가(deliverableId: string): boolean {
    return this.deliverableId === deliverableId;
  }

  /**
   * 매핑을 활성화한다
   */
  활성화한다(activatedBy?: string): void {
    this.isActive = true;

    if (activatedBy) {
      this.메타데이터를_업데이트한다(activatedBy);
    }
  }

  /**
   * 매핑을 비활성화한다
   */
  비활성화한다(deactivatedBy?: string): void {
    this.isActive = false;

    if (deactivatedBy) {
      this.메타데이터를_업데이트한다(deactivatedBy);
    }
  }

  /**
   * 매핑을 삭제한다
   */
  삭제한다(): void {
    this.deletedAt = new Date();
  }

  /**
   * DTO로 변환한다
   */
  DTO로_변환한다(): DeliverableMappingDto {
    return {
      id: this.id,
      employeeId: this.employeeId,
      wbsItemId: this.wbsItemId,
      deliverableId: this.deliverableId,
      mappedDate: this.mappedDate,
      mappedBy: this.mappedBy,
      isActive: this.isActive,
      createdBy: this.createdBy,
      updatedBy: this.updatedBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
      version: this.version,
    };
  }
}
