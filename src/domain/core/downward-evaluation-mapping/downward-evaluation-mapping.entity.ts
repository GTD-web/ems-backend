import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import { IDownwardEvaluationMapping } from './interfaces/downward-evaluation-mapping.interface';
import type {
  DownwardEvaluationMappingDto,
  CreateDownwardEvaluationMappingData,
} from './downward-evaluation-mapping.types';

/**
 * 하향평가 매핑 엔티티
 * 피평가자, 평가자, 프로젝트, 평가기간, 하향평가 간의 매핑을 관리합니다.
 */
@Entity('downward_evaluation_mapping')
@Index(['employeeId'])
@Index(['evaluatorId'])
@Index(['projectId'])
@Index(['periodId'])
@Index(['downwardEvaluationId'])
@Index(['selfEvaluationId'])
@Index(['employeeId', 'evaluatorId', 'periodId'])
export class DownwardEvaluationMapping
  extends BaseEntity<DownwardEvaluationMappingDto>
  implements IDownwardEvaluationMapping
{
  @Column({
    type: 'uuid',
    comment: '피평가자 ID',
  })
  employeeId: string;

  @Column({
    type: 'uuid',
    comment: '평가자 ID',
  })
  evaluatorId: string;

  @Column({
    type: 'uuid',
    comment: '프로젝트 ID',
  })
  projectId: string;

  @Column({
    type: 'uuid',
    comment: '평가 기간 ID',
  })
  periodId: string;

  @Column({
    type: 'uuid',
    comment: '하향평가 ID',
  })
  downwardEvaluationId: string;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: '자기평가 ID',
  })
  selfEvaluationId?: string;

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
    default: true,
    comment: '활성 상태',
  })
  isActive: boolean;

  constructor(data?: CreateDownwardEvaluationMappingData) {
    super();
    if (data) {
      this.employeeId = data.employeeId;
      this.evaluatorId = data.evaluatorId;
      this.projectId = data.projectId;
      this.periodId = data.periodId;
      this.downwardEvaluationId = data.downwardEvaluationId;
      this.selfEvaluationId = data.selfEvaluationId;
      this.mappedBy = data.mappedBy;
      this.mappedDate = new Date();
      this.isActive = true;

      // 감사 정보 설정
      this.메타데이터를_업데이트한다(data.mappedBy);
    }
  }

  /**
   * 특정 피평가자의 매핑인지 확인한다
   */
  해당_피평가자의_매핑인가(employeeId: string): boolean {
    return this.employeeId === employeeId;
  }

  /**
   * 특정 평가자의 매핑인지 확인한다
   */
  해당_평가자의_매핑인가(evaluatorId: string): boolean {
    return this.evaluatorId === evaluatorId;
  }

  /**
   * 특정 프로젝트의 매핑인지 확인한다
   */
  해당_프로젝트의_매핑인가(projectId: string): boolean {
    return this.projectId === projectId;
  }

  /**
   * 특정 평가기간의 매핑인지 확인한다
   */
  해당_평가기간의_매핑인가(periodId: string): boolean {
    return this.periodId === periodId;
  }

  /**
   * 자기평가가 연결된 매핑인지 확인한다
   */
  자기평가가_연결된_매핑인가(): boolean {
    return (
      this.selfEvaluationId !== null && this.selfEvaluationId !== undefined
    );
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
   * 자기평가를 연결한다
   */
  자기평가를_연결한다(selfEvaluationId: string, connectedBy?: string): void {
    this.selfEvaluationId = selfEvaluationId;

    if (connectedBy) {
      this.메타데이터를_업데이트한다(connectedBy);
    }
  }

  /**
   * 자기평가 연결을 해제한다
   */
  자기평가_연결을_해제한다(disconnectedBy?: string): void {
    this.selfEvaluationId = undefined;

    if (disconnectedBy) {
      this.메타데이터를_업데이트한다(disconnectedBy);
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
  DTO로_변환한다(): DownwardEvaluationMappingDto {
    return {
      id: this.id,
      employeeId: this.employeeId,
      evaluatorId: this.evaluatorId,
      projectId: this.projectId,
      periodId: this.periodId,
      downwardEvaluationId: this.downwardEvaluationId,
      selfEvaluationId: this.selfEvaluationId,
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
