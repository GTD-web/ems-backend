import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import type { IEvaluationResponse } from './interfaces/evaluation-response.interface';
import {
  EvaluationResponseType,
  type EvaluationResponseDto,
  type CreateEvaluationResponseDto,
} from './evaluation-response.types';

/**
 * 평가 응답 엔티티
 * 평가 질문에 대한 응답을 관리합니다.
 * PeerEvaluation, DownwardEvaluation 등 여러 평가 유형에서 사용됩니다.
 */
@Entity('evaluation_response')
@Index(['questionId'])
@Index(['evaluationId'])
@Index(['evaluationType'])
@Index(['evaluationId', 'questionId'], { unique: true })
export class EvaluationResponse
  extends BaseEntity<EvaluationResponseDto>
  implements IEvaluationResponse
{
  @Column({
    type: 'uuid',
    comment: '질문 ID',
  })
  questionId: string;

  @Column({
    type: 'uuid',
    comment: '평가 ID',
  })
  evaluationId: string;

  @Column({
    type: 'enum',
    enum: EvaluationResponseType,
    comment: '평가 유형',
  })
  evaluationType: EvaluationResponseType;

  @Column({
    type: 'text',
    nullable: true,
    comment: '응답 내용',
  })
  answer?: string;

  @Column({
    type: 'int',
    nullable: true,
    comment: '응답 점수',
  })
  score?: number;

  constructor(data?: CreateEvaluationResponseDto & { createdBy: string }) {
    super();
    if (data) {
      this.questionId = data.questionId;
      this.evaluationId = data.evaluationId;
      this.evaluationType = data.evaluationType;
      this.answer = data.answer;
      this.score = data.score;

      // 감사 정보 설정
      this.메타데이터를_업데이트한다(data.createdBy);
    }
  }

  /**
   * 응답 내용을 업데이트한다
   */
  응답내용업데이트한다(answer: string, updatedBy: string): void {
    this.answer = answer;
    this.메타데이터를_업데이트한다(updatedBy);
  }

  /**
   * 응답 점수를 업데이트한다
   */
  응답점수업데이트한다(score: number, updatedBy: string): void {
    this.score = score;
    this.메타데이터를_업데이트한다(updatedBy);
  }

  /**
   * 응답 내용과 점수를 함께 업데이트한다
   */
  응답전체업데이트한다(
    answer?: string,
    score?: number,
    updatedBy?: string,
  ): void {
    if (answer !== undefined) {
      this.answer = answer;
    }
    if (score !== undefined) {
      this.score = score;
    }
    if (updatedBy) {
      this.메타데이터를_업데이트한다(updatedBy);
    }
  }

  /**
   * 응답이 특정 질문에 대한 것인지 확인한다
   */
  질문일치하는가(questionId: string): boolean {
    return this.questionId === questionId;
  }

  /**
   * 응답이 특정 평가에 대한 것인지 확인한다
   */
  평가일치하는가(evaluationId: string): boolean {
    return this.evaluationId === evaluationId;
  }

  /**
   * 응답이 특정 평가 유형인지 확인한다
   */
  평가유형일치하는가(evaluationType: EvaluationResponseType): boolean {
    return this.evaluationType === evaluationType;
  }

  /**
   * 응답이 자기평가인지 확인한다
   */
  자기평가인가(): boolean {
    return this.evaluationType === EvaluationResponseType.SELF;
  }

  /**
   * 응답이 동료평가인지 확인한다
   */
  동료평가인가(): boolean {
    return this.evaluationType === EvaluationResponseType.PEER;
  }

  /**
   * 응답이 하향평가인지 확인한다
   */
  하향평가인가(): boolean {
    return this.evaluationType === EvaluationResponseType.DOWNWARD;
  }

  /**
   * 응답이 추가평가인지 확인한다
   */
  추가평가인가(): boolean {
    return this.evaluationType === EvaluationResponseType.ADDITIONAL;
  }

  /**
   * 응답 내용이 있는지 확인한다
   */
  응답내용있는가(): boolean {
    return this.answer !== undefined && this.answer.trim() !== '';
  }

  /**
   * 응답 점수가 있는지 확인한다
   */
  응답점수있는가(): boolean {
    return this.score !== undefined;
  }

  /**
   * 응답이 완전한지 확인한다 (내용 또는 점수가 있는지)
   */
  완전한응답인가(): boolean {
    return this.응답내용있는가() || this.응답점수있는가();
  }

  /**
   * 응답 점수가 유효한 범위 내에 있는지 확인한다
   */
  점수범위유효한가(minScore: number, maxScore: number): boolean {
    if (this.score === undefined) {
      return false;
    }
    return this.score >= minScore && this.score <= maxScore;
  }

  /**
   * DTO로 변환한다
   */
  DTO로_변환한다(): EvaluationResponseDto {
    return {
      id: this.id,
      questionId: this.questionId,
      evaluationId: this.evaluationId,
      evaluationType: this.evaluationType,
      answer: this.answer,
      score: this.score,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
