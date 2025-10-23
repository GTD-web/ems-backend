import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import { IPeerEvaluationQuestionMapping } from './interfaces/peer-evaluation-question-mapping.interface';
import type {
  PeerEvaluationQuestionMappingDto,
  CreatePeerEvaluationQuestionMappingDto,
} from './peer-evaluation-question-mapping.types';

/**
 * 동료평가 질문 매핑 엔티티
 * 동료평가와 평가 질문의 N:M 관계를 관리합니다.
 */
@Entity('peer_evaluation_question_mapping')
@Index(['peerEvaluationId', 'questionId'], { unique: true })
@Index(['peerEvaluationId', 'displayOrder'])
export class PeerEvaluationQuestionMapping
  extends BaseEntity<PeerEvaluationQuestionMappingDto>
  implements IPeerEvaluationQuestionMapping
{
  @Column({
    type: 'uuid',
    comment: '동료평가 ID',
  })
  peerEvaluationId: string;

  @Column({
    type: 'uuid',
    comment: '평가 질문 ID',
  })
  questionId: string;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: '질문 그룹 ID (그룹 단위 추가 시 사용)',
  })
  questionGroupId?: string;

  @Column({
    type: 'int',
    comment: '표시 순서',
  })
  displayOrder: number;

  @Column({
    type: 'text',
    nullable: true,
    comment: '답변 내용',
  })
  answer?: string;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: '답변일',
  })
  answeredAt?: Date;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: '답변자 ID',
  })
  answeredBy?: string;

  constructor(
    data?: CreatePeerEvaluationQuestionMappingDto & { createdBy: string },
  ) {
    super();
    if (data) {
      this.peerEvaluationId = data.peerEvaluationId;
      this.questionId = data.questionId;
      this.questionGroupId = data.questionGroupId;
      this.displayOrder = data.displayOrder;
      this.메타데이터를_업데이트한다(data.createdBy);
    }
  }

  /**
   * 표시 순서를 변경한다
   */
  표시순서변경한다(displayOrder: number, updatedBy: string): void {
    this.displayOrder = displayOrder;
    this.메타데이터를_업데이트한다(updatedBy);
  }

  /**
   * 동료평가 ID가 일치하는가
   */
  동료평가가_일치하는가(peerEvaluationId: string): boolean {
    return this.peerEvaluationId === peerEvaluationId;
  }

  /**
   * 질문 ID가 일치하는가
   */
  질문이_일치하는가(questionId: string): boolean {
    return this.questionId === questionId;
  }

  /**
   * 그룹 단위로 추가된 질문인지 확인한다
   */
  그룹단위로_추가되었는가(): boolean {
    return this.questionGroupId !== undefined && this.questionGroupId !== null;
  }

  /**
   * 질문 그룹이 일치하는가
   */
  질문그룹이_일치하는가(questionGroupId: string): boolean {
    return this.questionGroupId === questionGroupId;
  }

  /**
   * 답변이 있는가
   */
  답변이_있는가(): boolean {
    return (
      this.answer !== undefined &&
      this.answer !== null &&
      this.answer.trim() !== ''
    );
  }

  /**
   * 답변을 저장한다
   */
  답변을_저장한다(answer: string, answeredBy: string): void {
    this.answer = answer;
    this.answeredAt = new Date();
    this.answeredBy = answeredBy;
    this.메타데이터를_업데이트한다(answeredBy);
  }

  /**
   * 답변을 삭제한다
   */
  답변을_삭제한다(deletedBy: string): void {
    this.answer = undefined;
    this.answeredAt = undefined;
    this.answeredBy = undefined;
    this.메타데이터를_업데이트한다(deletedBy);
  }

  /**
   * DTO로 변환한다
   */
  DTO로_변환한다(): PeerEvaluationQuestionMappingDto {
    return {
      id: this.id,
      peerEvaluationId: this.peerEvaluationId,
      questionId: this.questionId,
      questionGroupId: this.questionGroupId,
      displayOrder: this.displayOrder,
      answer: this.answer,
      answeredAt: this.answeredAt,
      answeredBy: this.answeredBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
