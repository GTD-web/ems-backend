import { Entity, Column, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import { IEvaluationRevisionRequest } from './interfaces/evaluation-revision-request.interface';
import type {
  RevisionRequestStepType,
  EvaluationRevisionRequestDto,
  CreateRevisionRequestData,
  RecipientType,
} from './evaluation-revision-request.types';
import { EvaluationRevisionRequestRecipient } from './evaluation-revision-request-recipient.entity';

/**
 * 재작성 요청 엔티티
 * 평가 단계별 재작성 요청 정보를 관리합니다.
 */
@Entity('evaluation_revision_request')
@Index(['evaluationPeriodId'])
@Index(['employeeId'])
@Index(['step'])
@Index(['requestedBy'])
@Index(['requestedAt'])
export class EvaluationRevisionRequest
  extends BaseEntity<EvaluationRevisionRequestDto>
  implements IEvaluationRevisionRequest
{
  @Column({
    type: 'uuid',
    comment: '평가기간 ID',
  })
  evaluationPeriodId: string;

  @Column({
    type: 'uuid',
    comment: '피평가자 ID',
  })
  employeeId: string;

  @Column({
    type: 'enum',
    enum: ['criteria', 'self', 'primary', 'secondary'],
    comment: '재작성 요청 단계',
  })
  step: RevisionRequestStepType;

  @Column({
    type: 'text',
    comment: '재작성 요청 코멘트',
  })
  comment: string;

  @Column({
    type: 'uuid',
    comment: '요청자 ID (관리자)',
  })
  requestedBy: string;

  @Column({
    type: 'timestamp with time zone',
    comment: '요청 일시',
  })
  requestedAt: Date;

  @OneToMany(
    () => EvaluationRevisionRequestRecipient,
    (recipient) => recipient.revisionRequest,
    {
      cascade: true,
    },
  )
  recipients: EvaluationRevisionRequestRecipient[];

  constructor(data?: CreateRevisionRequestData) {
    super();
    if (data) {
      this.evaluationPeriodId = data.evaluationPeriodId;
      this.employeeId = data.employeeId;
      this.step = data.step;
      this.comment = data.comment;
      this.requestedBy = data.requestedBy;
      this.requestedAt = new Date();
      this.recipients = [];

      // 수신자 추가
      if (data.recipients && data.recipients.length > 0) {
        for (const recipientData of data.recipients) {
          this.수신자를_추가한다(
            recipientData.recipientId,
            recipientData.recipientType,
            data.createdBy,
          );
        }
      }

      // 감사 정보 설정
      this.메타데이터를_업데이트한다(data.createdBy);
    }
  }

  /**
   * 수신자를 추가한다
   */
  수신자를_추가한다(
    recipientId: string,
    recipientType: RecipientType,
    createdBy: string,
  ): void {
    // 중복 확인
    const exists = this.recipients.some(
      (r) => r.recipientId === recipientId && r.recipientType === recipientType,
    );

    if (exists) {
      return; // 이미 존재하는 수신자는 추가하지 않음
    }

    const recipient = new EvaluationRevisionRequestRecipient({
      revisionRequestId: this.id,
      recipientId,
      recipientType,
      createdBy,
    });

    this.recipients.push(recipient);
  }

  /**
   * DTO로 변환한다
   */
  DTO로_변환한다(): EvaluationRevisionRequestDto {
    return {
      id: this.id,
      evaluationPeriodId: this.evaluationPeriodId,
      employeeId: this.employeeId,
      step: this.step,
      comment: this.comment,
      requestedBy: this.requestedBy,
      requestedAt: this.requestedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }
}

