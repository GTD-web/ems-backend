import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import { IEvaluationQuestion } from './interfaces/evaluation-question.interface';
import type {
  EvaluationQuestionDto,
  CreateEvaluationQuestionDto,
} from './evaluation-question.types';
import {
  EmptyQuestionTextException,
  InvalidScoreRangeException,
} from './evaluation-question.exceptions';

/**
 * 평가 질문 엔티티
 * 평가에 사용되는 질문을 관리합니다.
 * QuestionGroupMapping을 통해 여러 그룹에 속할 수 있습니다.
 */
@Entity('evaluation_question')
@Index(['text'])
export class EvaluationQuestion
  extends BaseEntity<EvaluationQuestionDto>
  implements IEvaluationQuestion
{
  @Column({
    type: 'text',
    comment: '질문 내용',
  })
  text: string;

  @Column({
    type: 'int',
    nullable: true,
    comment: '최소 점수',
  })
  minScore?: number;

  @Column({
    type: 'int',
    nullable: true,
    comment: '최대 점수',
  })
  maxScore?: number;

  constructor(data?: CreateEvaluationQuestionDto & { createdBy: string }) {
    super();
    if (data) {
      if (!data.text || data.text.trim() === '') {
        throw new EmptyQuestionTextException();
      }

      // 점수 범위 검증 (둘 다 설정되어 있고 null이 아닐 때만)
      if (
        data.minScore !== undefined &&
        data.minScore !== null &&
        data.maxScore !== undefined &&
        data.maxScore !== null
      ) {
        if (data.minScore >= data.maxScore) {
          throw new InvalidScoreRangeException(data.minScore, data.maxScore);
        }
      }

      this.text = data.text;
      this.minScore = data.minScore;
      this.maxScore = data.maxScore;

      // 감사 정보 설정
      this.메타데이터를_업데이트한다(data.createdBy);
    }
  }

  /**
   * 질문 내용을 업데이트한다
   */
  질문내용업데이트한다(text: string, updatedBy: string): void {
    if (!text || text.trim() === '') {
      throw new EmptyQuestionTextException();
    }

    this.text = text;
    this.메타데이터를_업데이트한다(updatedBy);
  }

  /**
   * 점수 범위를 설정한다
   */
  점수범위설정한다(
    minScore: number | null | undefined,
    maxScore: number | null | undefined,
    updatedBy: string,
  ): void {
    // 둘 다 유효한 숫자일 때만 범위 검증
    if (
      minScore !== null &&
      minScore !== undefined &&
      maxScore !== null &&
      maxScore !== undefined
    ) {
      if (minScore >= maxScore) {
        throw new InvalidScoreRangeException(minScore, maxScore);
      }
    }

    this.minScore = minScore ?? undefined;
    this.maxScore = maxScore ?? undefined;
    this.메타데이터를_업데이트한다(updatedBy);
  }

  /**
   * 점수 범위가 유효한지 확인한다
   */
  점수범위유효한가(): boolean {
    if (this.minScore === undefined || this.maxScore === undefined) {
      return true; // 점수 범위가 없으면 유효함 (설문형)
    }
    return this.minScore < this.maxScore;
  }

  /**
   * 질문 내용이 유효한지 확인한다
   */
  질문내용유효한가(): boolean {
    return this.text !== undefined && this.text.trim() !== '';
  }

  /**
   * DTO로 변환한다
   */
  DTO로_변환한다(): EvaluationQuestionDto {
    return {
      id: this.id,
      text: this.text,
      minScore: this.minScore ?? undefined,
      maxScore: this.maxScore ?? undefined,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
