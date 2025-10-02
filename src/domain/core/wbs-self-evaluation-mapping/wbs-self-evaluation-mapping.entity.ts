import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import { IWbsSelfEvaluationMapping } from './interfaces/wbs-self-evaluation-mapping.interface';
import type {
  WbsSelfEvaluationMappingDto,
  CreateWbsSelfEvaluationMappingData,
} from './wbs-self-evaluation-mapping.types';

/**
 * WBS 자가평가 매핑 엔티티
 * 직원과 WBS 항목 간의 자가평가 매핑을 관리합니다.
 */
@Entity('wbs_self_evaluation_mapping')
@Index(['periodId', 'employeeId'])
@Index(['periodId', 'wbsItemId'])
@Index(['employeeId', 'wbsItemId'])
@Index(['assignedDate'])
export class WbsSelfEvaluationMapping
  extends BaseEntity<WbsSelfEvaluationMappingDto>
  implements IWbsSelfEvaluationMapping
{
  @Column({
    type: 'uuid',
    comment: '평가 기간 ID',
  })
  periodId: string;

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
    type: 'timestamp with time zone',
    comment: '할당일',
  })
  assignedDate: Date;

  @Column({
    type: 'uuid',
    comment: '할당자 ID',
  })
  assignedBy: string;

  @Column({
    type: 'boolean',
    default: false,
    comment: '자가평가 완료 여부',
  })
  isCompleted: boolean;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: '완료일',
  })
  completedAt?: Date;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: '자가평가 ID',
  })
  selfEvaluationId?: string;

  constructor(data?: CreateWbsSelfEvaluationMappingData) {
    super();
    if (data) {
      this.periodId = data.periodId;
      this.employeeId = data.employeeId;
      this.wbsItemId = data.wbsItemId;
      this.assignedBy = data.assignedBy;
      this.assignedDate = new Date();

      // 감사 정보 설정
      this.메타데이터를_업데이트한다(data.assignedBy);
    }
  }

  /**
   * 특정 평가기간에 속하는지 확인한다
   */
  평가기간과_일치하는가(periodId: string): boolean {
    return this.periodId === periodId;
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
   * 자가평가를 완료로 표시한다
   */
  자가평가를_완료한다(): void {
    this.isCompleted = true;
    this.completedAt = new Date();
  }

  /**
   * 자가평가 완료를 취소한다
   */
  자가평가_완료를_취소한다(): void {
    this.isCompleted = false;
    this.completedAt = undefined;
    this.selfEvaluationId = undefined;
  }

  /**
   * 자가평가 ID를 설정한다
   */
  자가평가_ID를_설정한다(selfEvaluationId: string): void {
    this.selfEvaluationId = selfEvaluationId;
  }

  /**
   * 자가평가가 연결되어 있는지 확인한다
   */
  자가평가가_연결되어_있는가(): boolean {
    return !!this.selfEvaluationId;
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
  DTO로_변환한다(): WbsSelfEvaluationMappingDto {
    return {
      id: this.id,
      periodId: this.periodId,
      employeeId: this.employeeId,
      wbsItemId: this.wbsItemId,
      assignedDate: this.assignedDate,
      assignedBy: this.assignedBy,
      isCompleted: this.isCompleted,
      completedAt: this.completedAt,
      selfEvaluationId: this.selfEvaluationId,
      createdBy: this.createdBy,
      updatedBy: this.updatedBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
      version: this.version,
    };
  }
}
