import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import { IDeliverable } from './interfaces/deliverable.interface';
import { DeliverableStatus, DeliverableType } from './deliverable.types';
import type {
  DeliverableDto,
  CreateDeliverableData,
} from './deliverable.types';

/**
 * 산출물 엔티티
 * 프로젝트에서 생성되는 산출물을 관리합니다.
 */
@Entity('deliverable')
@Index(['status'])
@Index(['type'])
@Index(['expectedCompletionDate'])
@Index(['actualCompletionDate'])
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
    type: 'enum',
    enum: ['pending', 'in_progress', 'completed', 'rejected'],
    default: 'pending',
    comment: '산출물 상태',
  })
  status: DeliverableStatus;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: '예상 완료일',
  })
  expectedCompletionDate?: Date;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: '실제 완료일',
  })
  actualCompletionDate?: Date;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: '파일 경로',
  })
  filePath?: string;

  @Column({
    type: 'bigint',
    nullable: true,
    comment: '파일 크기 (bytes)',
  })
  fileSize?: number;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'MIME 타입',
  })
  mimeType?: string;

  constructor(data?: CreateDeliverableData) {
    super();
    if (data) {
      this.name = data.name;
      this.description = data.description;
      this.type = data.type;
      this.status = data.status || DeliverableStatus.PENDING;
      this.expectedCompletionDate = data.expectedCompletionDate;
      this.filePath = data.filePath;
      this.fileSize = data.fileSize;
      this.mimeType = data.mimeType;

      // 감사 정보 설정
      this.메타데이터를_업데이트한다(data.createdBy);
    }
  }

  /**
   * 산출물 상태가 완료인지 확인한다
   */
  완료되었는가(): boolean {
    return this.status === DeliverableStatus.COMPLETED;
  }

  /**
   * 산출물 상태가 진행중인지 확인한다
   */
  진행중인가(): boolean {
    return this.status === DeliverableStatus.IN_PROGRESS;
  }

  /**
   * 산출물 상태가 대기중인지 확인한다
   */
  대기중인가(): boolean {
    return this.status === DeliverableStatus.PENDING;
  }

  /**
   * 산출물 상태가 거부되었는지 확인한다
   */
  거부되었는가(): boolean {
    return this.status === DeliverableStatus.REJECTED;
  }

  /**
   * 산출물을 완료로 표시한다
   */
  완료한다(completedBy?: string): void {
    this.status = DeliverableStatus.COMPLETED;
    this.actualCompletionDate = new Date();

    if (completedBy) {
      this.메타데이터를_업데이트한다(completedBy);
    }
  }

  /**
   * 산출물을 진행중으로 표시한다
   */
  진행중으로_변경한다(updatedBy?: string): void {
    this.status = DeliverableStatus.IN_PROGRESS;

    if (updatedBy) {
      this.메타데이터를_업데이트한다(updatedBy);
    }
  }

  /**
   * 산출물을 거부한다
   */
  거부한다(rejectedBy?: string): void {
    this.status = DeliverableStatus.REJECTED;

    if (rejectedBy) {
      this.메타데이터를_업데이트한다(rejectedBy);
    }
  }

  /**
   * 산출물을 수정한다
   */
  산출물을_수정한다(
    name?: string,
    description?: string,
    type?: DeliverableType,
    expectedCompletionDate?: Date,
    filePath?: string,
    fileSize?: number,
    mimeType?: string,
    updatedBy?: string,
  ): void {
    if (name !== undefined) this.name = name;
    if (description !== undefined) this.description = description;
    if (type !== undefined) this.type = type;
    if (expectedCompletionDate !== undefined)
      this.expectedCompletionDate = expectedCompletionDate;
    if (filePath !== undefined) this.filePath = filePath;
    if (fileSize !== undefined) this.fileSize = fileSize;
    if (mimeType !== undefined) this.mimeType = mimeType;

    if (updatedBy) {
      this.메타데이터를_업데이트한다(updatedBy);
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
      status: this.status,
      expectedCompletionDate: this.expectedCompletionDate,
      actualCompletionDate: this.actualCompletionDate,
      filePath: this.filePath,
      fileSize: this.fileSize,
      mimeType: this.mimeType,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
