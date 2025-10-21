import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import { IDeliverable } from './interfaces/deliverable.interface';
import { DeliverableType } from './deliverable.types';
import type {
  DeliverableDto,
  CreateDeliverableData,
} from './deliverable.types';

/**
 * 산출물 엔티티
 * 프로젝트에서 생성되는 산출물을 관리합니다.
 */
@Entity('deliverable')
@Index(['type'])
export class Deliverable
  extends BaseEntity<DeliverableDto>
  implements IDeliverable
{
  @Column({
    type: 'varchar',
    length: 255,
    comment: '산출물명',
  })
  name: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: '산출물 설명',
  })
  description?: string;

  @Column({
    type: 'enum',
    enum: ['document', 'code', 'design', 'report', 'presentation', 'other'],
    comment: '산출물 유형',
  })
  type: DeliverableType;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: '파일 경로',
  })
  filePath?: string;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: '직원 ID',
  })
  @Index()
  employeeId?: string;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'WBS 항목 ID',
  })
  @Index()
  wbsItemId?: string;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: '매핑일',
  })
  mappedDate?: Date;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: '매핑자 ID',
  })
  mappedBy?: string;

  @Column({
    type: 'boolean',
    default: true,
    comment: '활성 상태',
  })
  isActive: boolean;

  constructor(data?: CreateDeliverableData) {
    super();
    if (data) {
      this.name = data.name;
      this.description = data.description;
      this.type = data.type;
      this.filePath = data.filePath;
      this.employeeId = data.employeeId;
      this.wbsItemId = data.wbsItemId;
      this.mappedBy = data.mappedBy;
      this.mappedDate =
        data.mappedDate || (data.employeeId ? new Date() : undefined);
      this.isActive = data.isActive !== undefined ? data.isActive : true;

      // 감사 정보 설정
      this.메타데이터를_업데이트한다(data.createdBy);
    }
  }

  /**
   * 산출물을 수정한다
   */
  산출물을_수정한다(
    name?: string,
    description?: string,
    type?: DeliverableType,
    filePath?: string,
    employeeId?: string,
    wbsItemId?: string,
    updatedBy?: string,
  ): void {
    if (name !== undefined) this.name = name;
    if (description !== undefined) this.description = description;
    if (type !== undefined) this.type = type;
    if (filePath !== undefined) this.filePath = filePath;
    if (employeeId !== undefined) this.employeeId = employeeId;
    if (wbsItemId !== undefined) this.wbsItemId = wbsItemId;

    if (updatedBy) {
      this.메타데이터를_업데이트한다(updatedBy);
    }
  }

  /**
   * 특정 직원에게 할당되었는지 확인한다
   */
  직원에게_할당되었는가(employeeId: string): boolean {
    return this.employeeId === employeeId;
  }

  /**
   * 특정 WBS 항목에 연결되었는지 확인한다
   */
  WBS항목에_연결되었는가(wbsItemId: string): boolean {
    return this.wbsItemId === wbsItemId;
  }

  /**
   * 활성화한다
   */
  활성화한다(activatedBy?: string): void {
    this.isActive = true;

    if (activatedBy) {
      this.메타데이터를_업데이트한다(activatedBy);
    }
  }

  /**
   * 비활성화한다
   */
  비활성화한다(deactivatedBy?: string): void {
    this.isActive = false;

    if (deactivatedBy) {
      this.메타데이터를_업데이트한다(deactivatedBy);
    }
  }

  /**
   * 직원 및 WBS 항목에 매핑한다
   */
  매핑한다(employeeId: string, wbsItemId: string, mappedBy: string): void {
    this.employeeId = employeeId;
    this.wbsItemId = wbsItemId;
    this.mappedBy = mappedBy;
    this.mappedDate = new Date();
    this.isActive = true;

    this.메타데이터를_업데이트한다(mappedBy);
  }

  /**
   * 매핑을 해제한다
   */
  매핑을_해제한다(unmappedBy?: string): void {
    this.isActive = false;

    if (unmappedBy) {
      this.메타데이터를_업데이트한다(unmappedBy);
    }
  }

  /**
   * 산출물을 삭제한다
   */
  삭제한다(): void {
    this.deletedAt = new Date();
  }

  /**
   * DTO로 변환한다
   */
  DTO로_변환한다(): DeliverableDto {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      type: this.type,
      filePath: this.filePath,
      employeeId: this.employeeId,
      wbsItemId: this.wbsItemId,
      mappedDate: this.mappedDate,
      mappedBy: this.mappedBy,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      createdBy: this.createdBy,
      updatedBy: this.updatedBy,
      deletedAt: this.deletedAt,
      version: this.version,
    };
  }
}
