import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import { IQuestionGroupMapping } from './interfaces/question-group-mapping.interface';
import type {
  QuestionGroupMappingDto,
  CreateQuestionGroupMappingDto,
} from './question-group-mapping.types';
import { EvaluationQuestion } from '../evaluation-question/evaluation-question.entity';
import { QuestionGroup } from '../question-group/question-group.entity';

/**
 * 질문 그룹 매핑 엔티티
 * 평가 질문과 그룹의 N:M 관계를 관리합니다.
 * 하나의 질문이 여러 그룹에 속할 수 있습니다.
 */
@Entity('question_group_mapping')
@Index(['groupId'])
@Index(['questionId'])
@Index(['groupId', 'questionId'], { unique: true })
@Index(['displayOrder'])
export class QuestionGroupMapping
  extends BaseEntity<QuestionGroupMappingDto>
  implements IQuestionGroupMapping
{
  @Column({
    type: 'uuid',
    comment: '질문 그룹 ID',
  })
  groupId: string;

  @ManyToOne(() => QuestionGroup, { nullable: false })
  @JoinColumn({ name: 'groupId' })
  group?: QuestionGroup;

  @Column({
    type: 'uuid',
    comment: '평가 질문 ID',
  })
  questionId: string;

  @ManyToOne(() => EvaluationQuestion, { nullable: false })
  @JoinColumn({ name: 'questionId' })
  question?: EvaluationQuestion;

  @Column({
    type: 'int',
    default: 0,
    comment: '표시 순서',
  })
  displayOrder: number;

  constructor(data?: CreateQuestionGroupMappingDto & { createdBy: string }) {
    super();
    if (data) {
      this.groupId = data.groupId;
      this.questionId = data.questionId;
      this.displayOrder = data.displayOrder || 0;

      // 감사 정보 설정
      this.메타데이터를_업데이트한다(data.createdBy);
    }
  }

  /**
   * 표시 순서를 변경한다
   */
  표시순서변경한다(order: number, updatedBy: string): void {
    this.displayOrder = order;
    this.메타데이터를_업데이트한다(updatedBy);
  }

  /**
   * 특정 그룹의 매핑인지 확인한다
   */
  그룹일치하는가(groupId: string): boolean {
    return this.groupId === groupId;
  }

  /**
   * 특정 질문의 매핑인지 확인한다
   */
  질문일치하는가(questionId: string): boolean {
    return this.questionId === questionId;
  }

  /**
   * 특정 그룹과 질문의 매핑인지 확인한다
   */
  매핑일치하는가(groupId: string, questionId: string): boolean {
    return this.groupId === groupId && this.questionId === questionId;
  }

  /**
   * DTO로 변환한다
   */
  DTO로_변환한다(): QuestionGroupMappingDto {
    return {
      id: this.id,
      groupId: this.groupId,
      questionId: this.questionId,
      displayOrder: this.displayOrder,
      group: this.group ? this.group.DTO로_변환한다() : undefined,
      question: this.question ? this.question.DTO로_변환한다() : undefined,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
