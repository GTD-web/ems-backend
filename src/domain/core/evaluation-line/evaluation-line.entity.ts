import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import { IEvaluationLine } from './interfaces/evaluation-line.interface';
import { EvaluationLineDto, EvaluatorType } from './evaluation-line.types';

/**
 * 평가 라인 엔티티
 * 평가 체계에서 평가자의 유형과 순서를 정의하는 엔티티입니다.
 */
@Entity('evaluation_lines')
export class EvaluationLine
  extends BaseEntity<EvaluationLineDto>
  implements IEvaluationLine
{
  /**
   * 평가자 유형
   * 주평가자, 부평가자, 추가평가자 등을 구분합니다.
   */
  @Column({
    type: 'enum',
    enum: EvaluatorType,
    comment:
      '평가자 유형 (primary: 주평가자, secondary: 부평가자, additional: 추가평가자)',
  })
  evaluatorType: EvaluatorType;

  /**
   * 평가 순서
   * 평가가 진행되는 순서를 나타냅니다.
   */
  @Column({
    type: 'int',
    comment: '평가 순서',
  })
  order: number;

  /**
   * 필수 평가자 여부
   * 해당 평가 라인이 필수인지 선택적인지를 나타냅니다.
   */
  @Column({
    type: 'boolean',
    default: true,
    comment: '필수 평가자 여부',
  })
  isRequired: boolean;

  /**
   * 자동 할당 여부
   * 평가자가 자동으로 할당되는지 수동으로 지정되는지를 나타냅니다.
   */
  @Column({
    type: 'boolean',
    default: false,
    comment: '자동 할당 여부',
  })
  isAutoAssigned: boolean;

  /**
   * DTO로 변환
   */
  DTO로_변환한다(): EvaluationLineDto {
    return {
      id: this.id,
      evaluatorType: this.evaluatorType,
      order: this.order,
      isRequired: this.isRequired,
      isAutoAssigned: this.isAutoAssigned,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * 평가자 유형을 변경한다
   */
  평가자_유형을_변경한다(evaluatorType: EvaluatorType): void {
    this.evaluatorType = evaluatorType;
    this.메타데이터를_업데이트한다();
  }

  /**
   * 평가 순서를 변경한다
   */
  평가_순서를_변경한다(order: number): void {
    if (order < 1) {
      throw new Error('평가 순서는 1 이상이어야 합니다.');
    }
    this.order = order;
    this.메타데이터를_업데이트한다();
  }

  /**
   * 필수 평가자 여부를 변경한다
   */
  필수_평가자_여부를_변경한다(isRequired: boolean): void {
    this.isRequired = isRequired;
    this.메타데이터를_업데이트한다();
  }

  /**
   * 자동 할당 여부를 변경한다
   */
  자동_할당_여부를_변경한다(isAutoAssigned: boolean): void {
    this.isAutoAssigned = isAutoAssigned;
    this.메타데이터를_업데이트한다();
  }

  /**
   * 평가 라인이 유효한지 검증한다
   */
  유효성을_검증한다(): boolean {
    return (
      this.order > 0 &&
      Object.values(EvaluatorType).includes(this.evaluatorType)
    );
  }
}
