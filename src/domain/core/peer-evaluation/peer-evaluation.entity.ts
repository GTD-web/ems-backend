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
 */
@Entity('peer_evaluation')
@Index(['status'])
@Index(['evaluationDate'])
@Index(['score'])
export class PeerEvaluation
  extends BaseEntity<PeerEvaluationDto>
  implements IPeerEvaluation
{
  @Column({
    type: 'text',
    nullable: true,
    comment: '동료평가 내용',
  })
  evaluationContent?: string;

  @Column({
    type: 'int',
    nullable: true,
    comment: '동료평가 점수 (1-5)',
  })
  score?: number;

  @Column({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
    comment: '평가일',
  })
  evaluationDate: Date;

  @Column({
    type: 'enum',
    enum: ['pending', 'in_progress', 'completed'],
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

  constructor(data?: CreatePeerEvaluationData) {
    super();
    if (data) {
      this.evaluationContent = data.evaluationContent;
      this.score = data.score;
      this.status = data.status || PeerEvaluationStatus.PENDING;
      this.evaluationDate = data.evaluationDate || new Date();
      this.isCompleted = data.isCompleted || false;

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
   * 동료평가 점수가 유효한지 확인한다
   */
  점수가_유효한가(): boolean {
    return this.score !== undefined && this.score >= 1 && this.score <= 5;
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
   * 동료평가를 수정한다
   */
  동료평가를_수정한다(
    content?: string,
    score?: number,
    updatedBy?: string,
  ): void {
    if (content !== undefined) {
      this.evaluationContent = content;
    }
    if (score !== undefined) {
      this.score = score;
    }

    if (updatedBy) {
      this.메타데이터를_업데이트한다(updatedBy);
    }
  }

  /**
   * 동료평가를 삭제한다
   */
  삭제한다(): void {
    this.deletedAt = new Date();
  }

  /**
   * DTO로 변환한다
   */
  DTO로_변환한다(): PeerEvaluationDto {
    return {
      id: this.id,
      evaluationContent: this.evaluationContent,
      score: this.score,
      evaluationDate: this.evaluationDate,
      status: this.status,
      isCompleted: this.isCompleted,
      completedAt: this.completedAt,
      createdBy: this.createdBy,
      updatedBy: this.updatedBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
      version: this.version,
    };
  }
}
