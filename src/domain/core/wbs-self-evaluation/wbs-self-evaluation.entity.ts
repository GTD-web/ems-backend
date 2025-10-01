import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import { IWbsSelfEvaluation } from './interfaces/wbs-self-evaluation.interface';
import type {
  WbsSelfEvaluationDto,
  CreateWbsSelfEvaluationData,
} from './wbs-self-evaluation.types';

/**
 * WBS 자가평가 엔티티
 * 직원이 특정 WBS 항목에 대해 수행한 자가평가를 관리합니다.
 */
@Entity('wbs_self_evaluation')
@Index(['periodId', 'employeeId'])
@Index(['periodId', 'wbsItemId'])
@Index(['employeeId', 'wbsItemId'])
@Index(['evaluationDate'])
export class WbsSelfEvaluation
  extends BaseEntity<WbsSelfEvaluationDto>
  implements IWbsSelfEvaluation
{
  @Column({
    type: 'uuid',
    comment: '평가 기간 ID',
  })
  periodId: string;

  @Column({
    type: 'uuid',
    comment: '직원 ID',
  })
  employeeId: string;

  @Column({
    type: 'uuid',
    comment: 'WBS 항목 ID',
  })
  wbsItemId: string;

  @Column({
    type: 'timestamp with time zone',
    comment: '평가일',
  })
  evaluationDate: Date;

  @Column({
    type: 'text',
    comment: '자가평가 내용',
  })
  selfEvaluationContent: string;

  @Column({
    type: 'integer',
    comment: '자가평가 점수 (1-5)',
    default: 1,
  })
  selfEvaluationScore: number;

  @Column({
    type: 'text',
    nullable: true,
    comment: '추가 의견',
  })
  additionalComments?: string;

  constructor(data?: CreateWbsSelfEvaluationData) {
    super();
    if (data) {
      this.periodId = data.periodId;
      this.employeeId = data.employeeId;
      this.wbsItemId = data.wbsItemId;
      this.selfEvaluationContent = data.selfEvaluationContent;
      this.selfEvaluationScore = data.selfEvaluationScore;
      this.additionalComments = data.additionalComments;
      this.evaluationDate = new Date();

      // 감사 정보 설정
      this.메타데이터를_업데이트한다(data.createdBy);
    }
  }

  /**
   * 특정 평가기간에 속하는지 확인한다
   */
  평가기간과_일치하는가(periodId: string): boolean {
    return this.periodId === periodId;
  }

  /**
   * 특정 직원의 자가평가인지 확인한다
   */
  해당_직원의_자가평가인가(employeeId: string): boolean {
    return this.employeeId === employeeId;
  }

  /**
   * 특정 WBS 항목의 자가평가인지 확인한다
   */
  해당_WBS항목의_자가평가인가(wbsItemId: string): boolean {
    return this.wbsItemId === wbsItemId;
  }

  /**
   * 자가평가 점수가 유효한 범위인지 확인한다
   */
  점수가_유효한가(): boolean {
    return this.selfEvaluationScore >= 1 && this.selfEvaluationScore <= 5;
  }

  /**
   * 자가평가를 수정한다
   */
  자가평가를_수정한다(
    content: string,
    score: number,
    comments?: string,
    updatedBy?: string,
  ): void {
    this.selfEvaluationContent = content;
    this.selfEvaluationScore = score;
    this.additionalComments = comments;
    this.evaluationDate = new Date();

    if (updatedBy) {
      this.메타데이터를_업데이트한다(updatedBy);
    }
  }

  /**
   * 자가평가를 삭제한다
   */
  삭제한다(): void {
    this.deletedAt = new Date();
  }

  /**
   * DTO로 변환한다
   */
  DTO로_변환한다(): WbsSelfEvaluationDto {
    return {
      id: this.id,
      periodId: this.periodId,
      employeeId: this.employeeId,
      wbsItemId: this.wbsItemId,
      evaluationDate: this.evaluationDate,
      selfEvaluationContent: this.selfEvaluationContent,
      selfEvaluationScore: this.selfEvaluationScore,
      additionalComments: this.additionalComments,
      createdBy: this.createdBy,
      updatedBy: this.updatedBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
      version: this.version,
    };
  }
}
