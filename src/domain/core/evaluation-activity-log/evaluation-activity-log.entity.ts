import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import { IEvaluationActivityLog } from './interfaces/evaluation-activity-log.interface';
import type {
  EvaluationActivityLogDto,
  CreateEvaluationActivityLogData,
} from './evaluation-activity-log.types';

/**
 * 평가 활동 내역 엔티티
 * 평가기간 피평가자 기준으로 일어난 모든 평가 활동 내역을 관리합니다.
 */
@Entity('evaluation_activity_log')
@Index(['periodId', 'employeeId'])
@Index(['activityType'])
@Index(['activityDate'])
@Index(['performedBy'])
export class EvaluationActivityLog
  extends BaseEntity<EvaluationActivityLogDto>
  implements IEvaluationActivityLog
{
  @Column({
    type: 'uuid',
    comment: '평가 기간 ID',
  })
  periodId: string;

  @Column({
    type: 'uuid',
    comment: '피평가자 ID',
  })
  employeeId: string;

  @Column({
    type: 'varchar',
    length: 50,
    comment: '활동 유형',
  })
  activityType: string;

  @Column({
    type: 'varchar',
    length: 50,
    comment: '활동 액션',
  })
  activityAction: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '활동 제목',
  })
  activityTitle?: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: '활동 설명',
  })
  activityDescription?: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: '관련 엔티티 유형',
  })
  relatedEntityType?: string;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: '관련 엔티티 ID',
  })
  relatedEntityId?: string;

  @Column({
    type: 'uuid',
    comment: '활동 수행자 ID',
  })
  performedBy: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '활동 수행자 이름',
  })
  performedByName?: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: '활동 메타데이터',
  })
  activityMetadata?: Record<string, any>;

  @Column({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
    comment: '활동 일시',
  })
  activityDate: Date;

  constructor(data?: CreateEvaluationActivityLogData) {
    super();
    if (data) {
      this.periodId = data.periodId;
      this.employeeId = data.employeeId;
      this.activityType = data.activityType;
      this.activityAction = data.activityAction;
      this.activityTitle = data.activityTitle;
      this.activityDescription = data.activityDescription;
      this.relatedEntityType = data.relatedEntityType;
      this.relatedEntityId = data.relatedEntityId;
      this.performedBy = data.performedBy;
      this.performedByName = data.performedByName;
      this.activityMetadata = data.activityMetadata;
      this.activityDate = data.activityDate || new Date();

      // 감사 정보 설정
      this.메타데이터를_업데이트한다(data.createdBy);
    }
  }

  /**
   * 엔티티를 DTO로 변환한다
   */
  DTO로_변환한다(): EvaluationActivityLogDto {
    return {
      id: this.id,
      periodId: this.periodId,
      employeeId: this.employeeId,
      activityType: this.activityType as any,
      activityAction: this.activityAction as any,
      activityTitle: this.activityTitle,
      activityDescription: this.activityDescription,
      relatedEntityType: this.relatedEntityType,
      relatedEntityId: this.relatedEntityId,
      performedBy: this.performedBy,
      performedByName: this.performedByName,
      activityMetadata: this.activityMetadata,
      activityDate: this.activityDate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
      createdBy: this.createdBy,
      updatedBy: this.updatedBy,
      version: this.version,
    };
  }
}

