import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import { IFinalEvaluation } from './interfaces/final-evaluation.interface';
import {
  FinalEvaluationDto,
  JobGrade,
  JobDetailedGrade,
} from './final-evaluation.types';
import {
  AlreadyConfirmedEvaluationException,
  NotConfirmedEvaluationException,
} from './final-evaluation.exceptions';

/**
 * 최종평가 엔티티
 * 직원의 평가 기간에 대한 최종 평가 결과를 저장하는 엔티티입니다.
 * 자기평가, 동료평가, 하향평가 등을 종합하여 최종적인 평가 등급과 직무 등급을 결정합니다.
 */
@Entity('final_evaluations')
@Index(['employeeId', 'periodId'], { unique: true })
export class FinalEvaluation
  extends BaseEntity<FinalEvaluationDto>
  implements IFinalEvaluation
{
  /**
   * 피평가자(직원) ID
   */
  @Column({
    type: 'varchar',
    length: 255,
    comment: '피평가자(직원) ID',
  })
  employeeId: string;

  /**
   * 평가기간 ID
   */
  @Column({
    type: 'varchar',
    length: 255,
    comment: '평가기간 ID',
  })
  periodId: string;

  /**
   * 평가등급 (문자열, 예: S, A, B, C, D 등)
   */
  @Column({
    type: 'varchar',
    length: 10,
    comment: '평가등급 (예: S, A, B, C, D)',
  })
  evaluationGrade: string;

  /**
   * 직무등급
   * T1(낮음) → T2(중간) → T3(높음)
   */
  @Column({
    type: 'enum',
    enum: JobGrade,
    comment: '직무등급 (T1: 낮음, T2: 중간, T3: 높음)',
  })
  jobGrade: JobGrade;

  /**
   * 직무 상세등급
   * u(낮음) → n(중간) → a(높음)
   */
  @Column({
    type: 'enum',
    enum: JobDetailedGrade,
    comment: '직무 상세등급 (u: 낮음, n: 중간, a: 높음)',
  })
  jobDetailedGrade: JobDetailedGrade;

  /**
   * 최종 평가 의견/코멘트
   */
  @Column({
    type: 'text',
    nullable: true,
    comment: '최종 평가 의견/코멘트',
  })
  finalComments?: string;

  /**
   * 확정 여부
   */
  @Column({
    type: 'boolean',
    default: false,
    comment: '확정 여부',
  })
  isConfirmed: boolean;

  /**
   * 확정일시
   */
  @Column({
    type: 'timestamp',
    nullable: true,
    comment: '확정일시',
  })
  confirmedAt?: Date | null;

  /**
   * 확정자 ID
   */
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '확정자 ID',
  })
  confirmedBy?: string | null;

  /**
   * DTO로 변환
   */
  DTO로_변환한다(): FinalEvaluationDto {
    return {
      id: this.id,
      employeeId: this.employeeId,
      periodId: this.periodId,
      evaluationGrade: this.evaluationGrade,
      jobGrade: this.jobGrade,
      jobDetailedGrade: this.jobDetailedGrade,
      finalComments: this.finalComments,
      isConfirmed: this.isConfirmed,
      confirmedAt: this.confirmedAt,
      confirmedBy: this.confirmedBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
      createdBy: this.createdBy,
      updatedBy: this.updatedBy,
      version: this.version,
    };
  }

  /**
   * 평가등급을 변경한다
   */
  평가등급을_변경한다(evaluationGrade: string, updatedBy?: string): void {
    if (this.isConfirmed) {
      throw new Error('확정된 평가는 수정할 수 없습니다.');
    }
    this.evaluationGrade = evaluationGrade;
    this.메타데이터를_업데이트한다(updatedBy);
  }

  /**
   * 직무등급을 변경한다
   */
  직무등급을_변경한다(jobGrade: JobGrade, updatedBy?: string): void {
    if (this.isConfirmed) {
      throw new Error('확정된 평가는 수정할 수 없습니다.');
    }
    this.jobGrade = jobGrade;
    this.메타데이터를_업데이트한다(updatedBy);
  }

  /**
   * 직무 상세등급을 변경한다
   */
  직무_상세등급을_변경한다(
    jobDetailedGrade: JobDetailedGrade,
    updatedBy?: string,
  ): void {
    if (this.isConfirmed) {
      throw new Error('확정된 평가는 수정할 수 없습니다.');
    }
    this.jobDetailedGrade = jobDetailedGrade;
    this.메타데이터를_업데이트한다(updatedBy);
  }

  /**
   * 최종 평가 의견을 변경한다
   */
  최종_평가_의견을_변경한다(finalComments: string, updatedBy?: string): void {
    if (this.isConfirmed) {
      throw new Error('확정된 평가는 수정할 수 없습니다.');
    }
    this.finalComments = finalComments;
    this.메타데이터를_업데이트한다(updatedBy);
  }

  /**
   * 평가를 확정한다
   */
  평가를_확정한다(confirmedBy: string): void {
    if (this.isConfirmed) {
      throw new AlreadyConfirmedEvaluationException(this.id);
    }
    this.isConfirmed = true;
    this.confirmedAt = new Date();
    this.confirmedBy = confirmedBy;
    this.메타데이터를_업데이트한다(confirmedBy);
  }

  /**
   * 평가 확정을 취소한다
   */
  평가_확정을_취소한다(updatedBy: string): void {
    if (!this.isConfirmed) {
      throw new NotConfirmedEvaluationException(this.id, '확정 취소');
    }
    this.isConfirmed = false;
    this.confirmedAt = null;
    this.confirmedBy = null;
    this.메타데이터를_업데이트한다(updatedBy);
  }

  /**
   * 최종평가가 확정되었는지 확인한다
   */
  확정되었는가(): boolean {
    return this.isConfirmed;
  }

  /**
   * 최종평가가 수정 가능한지 확인한다
   */
  수정_가능한가(): boolean {
    return !this.isConfirmed;
  }

  /**
   * 최종평가가 유효한지 검증한다
   */
  유효성을_검증한다(): boolean {
    return (
      !!this.employeeId &&
      !!this.periodId &&
      !!this.evaluationGrade &&
      !!this.jobGrade &&
      !!this.jobDetailedGrade &&
      Object.values(JobGrade).includes(this.jobGrade) &&
      Object.values(JobDetailedGrade).includes(this.jobDetailedGrade)
    );
  }
}
