import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import { IDownwardEvaluation } from './interfaces/downward-evaluation.interface';
import { DownwardEvaluationType } from './downward-evaluation.types';
import type {
  DownwardEvaluationDto,
  CreateDownwardEvaluationData,
} from './downward-evaluation.types';

/**
 * 하향평가 엔티티
 * 상관이 자기평가를 평가하는 하향평가를 관리합니다.
 */
@Entity('downward_evaluation')
@Index(['evaluationType'])
@Index(['evaluationDate'])
@Index(['downwardEvaluationScore'])
export class DownwardEvaluation
  extends BaseEntity<DownwardEvaluationDto>
  implements IDownwardEvaluation
{
  @Column({
    type: 'text',
    nullable: true,
    comment: '하향평가 내용',
  })
  downwardEvaluationContent?: string;

  @Column({
    type: 'int',
    nullable: true,
    comment: '하향평가 점수 (1-5)',
  })
  downwardEvaluationScore?: number;

  @Column({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
    comment: '평가일',
  })
  evaluationDate: Date;

  @Column({
    type: 'enum',
    enum: ['primary', 'secondary'],
    comment: '평가 유형',
  })
  evaluationType: DownwardEvaluationType;

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

  constructor(data?: CreateDownwardEvaluationData) {
    super();
    if (data) {
      this.downwardEvaluationContent = data.downwardEvaluationContent;
      this.downwardEvaluationScore = data.downwardEvaluationScore;
      this.evaluationType = data.evaluationType;
      this.evaluationDate = data.evaluationDate || new Date();
      this.isCompleted = data.isCompleted || false;

      // 감사 정보 설정
      this.메타데이터를_업데이트한다(data.createdBy);
    }
  }

  /**
   * 하향평가가 완료되었는지 확인한다
   */
  완료되었는가(): boolean {
    return this.isCompleted;
  }

  /**
   * 하향평가 점수가 유효한지 확인한다
   */
  점수가_유효한가(): boolean {
    return (
      this.downwardEvaluationScore !== undefined &&
      this.downwardEvaluationScore >= 1 &&
      this.downwardEvaluationScore <= 5
    );
  }

  /**
   * 하향평가를 완료한다
   */
  평가를_완료한다(completedBy?: string): void {
    this.isCompleted = true;
    this.completedAt = new Date();

    if (completedBy) {
      this.메타데이터를_업데이트한다(completedBy);
    }
  }

  /**
   * 하향평가를 수정한다
   */
  하향평가를_수정한다(
    content?: string,
    score?: number,
    updatedBy?: string,
  ): void {
    if (content !== undefined) {
      this.downwardEvaluationContent = content;
    }
    if (score !== undefined) {
      this.downwardEvaluationScore = score;
    }

    if (updatedBy) {
      this.메타데이터를_업데이트한다(updatedBy);
    }
  }

  /**
   * 하향평가를 삭제한다
   */
  삭제한다(): void {
    this.deletedAt = new Date();
  }

  /**
   * DTO로 변환한다
   */
  DTO로_변환한다(): DownwardEvaluationDto {
    return {
      id: this.id,
      downwardEvaluationContent: this.downwardEvaluationContent,
      downwardEvaluationScore: this.downwardEvaluationScore,
      evaluationDate: this.evaluationDate,
      evaluationType: this.evaluationType,
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
