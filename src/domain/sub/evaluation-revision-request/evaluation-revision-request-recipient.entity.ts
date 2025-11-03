import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import { IEvaluationRevisionRequestRecipient } from './interfaces/evaluation-revision-request-recipient.interface';
import type {
  RecipientType,
  EvaluationRevisionRequestRecipientDto,
  CreateRecipientData,
} from './evaluation-revision-request.types';
import {
  EmptyResponseCommentException,
  RevisionRequestAlreadyCompletedException,
} from './evaluation-revision-request.exceptions';
import { EvaluationRevisionRequest } from './evaluation-revision-request.entity';

/**
 * 재작성 요청 수신자 엔티티
 * 재작성 요청을 수신한 담당자 정보 및 응답 상태를 관리합니다.
 */
@Entity('evaluation_revision_request_recipient')
@Index(['revisionRequestId'])
@Index(['recipientId'])
@Index(['isRead'])
@Index(['isCompleted'])
export class EvaluationRevisionRequestRecipient
  extends BaseEntity<EvaluationRevisionRequestRecipientDto>
  implements IEvaluationRevisionRequestRecipient
{
  @Column({
    type: 'uuid',
    comment: '재작성 요청 ID',
  })
  revisionRequestId: string;

  @ManyToOne(() => EvaluationRevisionRequest, (request) => request.recipients)
  @JoinColumn({ name: 'revisionRequestId' })
  revisionRequest: EvaluationRevisionRequest;

  @Column({
    type: 'uuid',
    comment: '수신자 ID',
  })
  recipientId: string;

  @Column({
    type: 'enum',
    enum: ['evaluatee', 'primary_evaluator', 'secondary_evaluator'],
    comment: '수신자 타입',
  })
  recipientType: RecipientType;

  @Column({
    type: 'boolean',
    default: false,
    comment: '읽음 여부',
  })
  isRead: boolean;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: '읽은 일시',
  })
  readAt: Date | null;

  @Column({
    type: 'boolean',
    default: false,
    comment: '재작성 완료 여부',
  })
  isCompleted: boolean;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: '재작성 완료 일시',
  })
  completedAt: Date | null;

  @Column({
    type: 'text',
    nullable: true,
    comment: '재작성 완료 응답 코멘트',
  })
  responseComment: string | null;

  constructor(data?: CreateRecipientData) {
    super();
    if (data) {
      this.revisionRequestId = data.revisionRequestId;
      this.recipientId = data.recipientId;
      this.recipientType = data.recipientType;
      this.isRead = false;
      this.readAt = null;
      this.isCompleted = false;
      this.completedAt = null;
      this.responseComment = null;

      // 감사 정보 설정
      this.메타데이터를_업데이트한다(data.createdBy);
    }
  }

  /**
   * 읽음 처리한다
   */
  읽음처리한다(): void {
    if (this.isRead) {
      return; // 이미 읽은 경우 중복 처리 방지
    }

    this.isRead = true;
    this.readAt = new Date();
    this.메타데이터를_업데이트한다(this.recipientId);
  }

  /**
   * 읽지 않음으로 변경한다
   */
  읽지않음으로_변경한다(): void {
    this.isRead = false;
    this.readAt = null;
    this.메타데이터를_업데이트한다(this.recipientId);
  }

  /**
   * 읽음 상태인지 확인한다
   */
  읽음상태인가(): boolean {
    return this.isRead;
  }

  /**
   * 재작성 완료 응답을 제출한다
   * 재작성을 완료했다는 것은 요청을 읽었다는 의미이므로 자동으로 읽음 처리
   */
  재작성완료_응답한다(responseComment: string): void {
    if (!responseComment || responseComment.trim() === '') {
      throw new EmptyResponseCommentException();
    }

    if (this.isCompleted) {
      throw new RevisionRequestAlreadyCompletedException(
        this.revisionRequestId,
      );
    }

    // 재작성 완료 처리
    this.isCompleted = true;
    this.completedAt = new Date();
    this.responseComment = responseComment;

    // 자동으로 읽음 처리 (재작성을 완료했다면 당연히 읽은 것)
    if (!this.isRead) {
      this.isRead = true;
      this.readAt = new Date();
    }

    this.메타데이터를_업데이트한다(this.recipientId);
  }

  /**
   * 재작성 완료 응답을 취소한다
   */
  재작성완료_응답을_취소한다(): void {
    this.isCompleted = false;
    this.completedAt = null;
    this.responseComment = null;
    this.메타데이터를_업데이트한다(this.recipientId);
  }

  /**
   * 특정 수신자의 요청인지 확인한다
   */
  특정수신자의_요청인가(recipientId: string): boolean {
    return this.recipientId === recipientId;
  }

  /**
   * DTO로 변환한다
   */
  DTO로_변환한다(): EvaluationRevisionRequestRecipientDto {
    return {
      id: this.id,
      revisionRequestId: this.revisionRequestId,
      recipientId: this.recipientId,
      recipientType: this.recipientType,
      isRead: this.isRead,
      readAt: this.readAt,
      isCompleted: this.isCompleted,
      completedAt: this.completedAt,
      responseComment: this.responseComment,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }
}
