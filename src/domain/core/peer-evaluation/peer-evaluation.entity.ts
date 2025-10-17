import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import { IPeerEvaluation } from './interfaces/peer-evaluation.interface';
import { PeerEvaluationStatus } from './peer-evaluation.types';
import type {
  PeerEvaluationDto,
  CreatePeerEvaluationData,
} from './peer-evaluation.types';

/**
 * 동료평가 엔티티
 * 동료가 동료를 평가하는 동료평가를 관리합니다.
 * 피평가자, 평가자, 평가기간 정보를 포함합니다.
 */
@Entity('peer_evaluation')
@Index(['status'])
@Index(['evaluationDate'])
@Index(['evaluateeId'])
@Index(['evaluatorId'])
@Index(['periodId'])
@Index(['evaluateeId', 'evaluatorId', 'periodId'])
export class PeerEvaluation
  extends BaseEntity<PeerEvaluationDto>
  implements IPeerEvaluation
{
  @Column({
    type: 'uuid',
    comment: '피평가자 ID',
  })
  evaluateeId: string;

  @Column({
    type: 'uuid',
    comment: '평가자 ID',
  })
  evaluatorId: string;

  @Column({
    type: 'uuid',
    comment: '평가 기간 ID',
  })
  periodId: string;

  @Column({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
    comment: '평가일',
  })
  evaluationDate: Date;

  @Column({
    type: 'enum',
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending',
    comment: '평가 상태',
  })
  status: PeerEvaluationStatus;

  @Column({
    type: 'boolean',
    default: false,
    comment: '평가 완료 여부',
  })
  isCompleted: boolean;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: '평가 완료일',
  })
  completedAt?: Date;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: '요청 마감일',
  })
  requestDeadline?: Date;

  @Column({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
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

  constructor(data?: CreatePeerEvaluationData) {
    super();
    if (data) {
      this.evaluateeId = data.evaluateeId;
      this.evaluatorId = data.evaluatorId;
      this.periodId = data.periodId;
      this.status = data.status || PeerEvaluationStatus.PENDING;
      this.evaluationDate = data.evaluationDate || new Date();
      this.isCompleted = data.isCompleted || false;
      this.requestDeadline = data.requestDeadline;
      this.mappedDate = data.mappedDate || new Date();
      this.mappedBy = data.mappedBy || data.createdBy;
      this.isActive = data.isActive !== undefined ? data.isActive : true;

      // 감사 정보 설정
      this.메타데이터를_업데이트한다(data.createdBy);
    }
  }

  /**
   * 동료평가가 완료되었는지 확인한다
   */
  완료되었는가(): boolean {
    return this.isCompleted;
  }

  /**
   * 동료평가가 진행중인지 확인한다
   */
  진행중인가(): boolean {
    return this.status === PeerEvaluationStatus.IN_PROGRESS;
  }

  /**
   * 동료평가가 대기중인지 확인한다
   */
  대기중인가(): boolean {
    return this.status === PeerEvaluationStatus.PENDING;
  }

  /**
   * 요청 마감일이 지났는지 확인한다
   */
  마감일이_지났는가(): boolean {
    if (!this.requestDeadline) {
      return false;
    }
    return new Date() > this.requestDeadline;
  }

  /**
   * 요청 마감일이 있는지 확인한다
   */
  마감일이_있는가(): boolean {
    return this.requestDeadline !== null && this.requestDeadline !== undefined;
  }

  /**
   * 동료평가를 완료한다
   */
  평가를_완료한다(completedBy?: string): void {
    this.status = PeerEvaluationStatus.COMPLETED;
    this.isCompleted = true;
    this.completedAt = new Date();

    if (completedBy) {
      this.메타데이터를_업데이트한다(completedBy);
    }
  }

  /**
   * 동료평가를 진행중으로 변경한다
   */
  진행중으로_변경한다(updatedBy?: string): void {
    this.status = PeerEvaluationStatus.IN_PROGRESS;
    this.isCompleted = false;
    this.completedAt = undefined;

    if (updatedBy) {
      this.메타데이터를_업데이트한다(updatedBy);
    }
  }

  /**
   * 동료평가를 취소한다
   */
  취소한다(cancelledBy?: string): void {
    this.status = PeerEvaluationStatus.CANCELLED;
    this.isCompleted = false;
    this.completedAt = undefined;

    if (cancelledBy) {
      this.메타데이터를_업데이트한다(cancelledBy);
    }
  }

  /**
   * 동료평가를 삭제한다
   */
  삭제한다(): void {
    this.deletedAt = new Date();
  }

  /**
   * 특정 피평가자의 평가인지 확인한다
   */
  해당_피평가자의_평가인가(evaluateeId: string): boolean {
    return this.evaluateeId === evaluateeId;
  }

  /**
   * 특정 평가자의 평가인지 확인한다
   */
  해당_평가자의_평가인가(evaluatorId: string): boolean {
    return this.evaluatorId === evaluatorId;
  }

  /**
   * 특정 평가기간의 평가인지 확인한다
   */
  해당_평가기간의_평가인가(periodId: string): boolean {
    return this.periodId === periodId;
  }

  /**
   * 자기 자신을 평가하는지 확인한다
   */
  자기_자신을_평가하는가(): boolean {
    return this.evaluateeId === this.evaluatorId;
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
   * DTO로 변환한다
   */
  DTO로_변환한다(): PeerEvaluationDto {
    return {
      id: this.id,
      evaluateeId: this.evaluateeId,
      evaluatorId: this.evaluatorId,
      periodId: this.periodId,
      evaluationDate: this.evaluationDate,
      status: this.status,
      isCompleted: this.isCompleted,
      completedAt: this.completedAt,
      requestDeadline: this.requestDeadline,
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
