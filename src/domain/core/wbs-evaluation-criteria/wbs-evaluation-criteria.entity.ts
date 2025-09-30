import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import { IWbsEvaluationCriteria } from './interfaces/wbs-evaluation-criteria.interface';
import { WbsEvaluationCriteriaDto } from './wbs-evaluation-criteria.types';

/**
 * WBS 평가 기준 엔티티
 * WBS 항목별 개별 평가 기준을 관리하는 엔티티입니다.
 */
@Entity('wbs_evaluation_criteria')
export class WbsEvaluationCriteria
  extends BaseEntity<WbsEvaluationCriteriaDto>
  implements IWbsEvaluationCriteria
{
  /**
   * WBS 항목 ID
   * 평가 기준이 적용되는 WBS 항목의 식별자입니다.
   */
  @Column({
    type: 'uuid',
    comment: 'WBS 항목 ID - 평가 기준이 적용되는 WBS 항목 식별자',
  })
  wbsItemId: string;

  /**
   * 평가 기준 내용
   * 실제 평가 기준의 내용입니다.
   */
  @Column({
    type: 'text',
    comment: '평가 기준 내용 - 실제 평가 기준의 상세 내용',
  })
  criteria: string;

  /**
   * DTO로 변환
   */
  DTO로_변환한다(): WbsEvaluationCriteriaDto {
    return {
      id: this.id,
      wbsItemId: this.wbsItemId,
      criteria: this.criteria,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * 평가 기준 내용을 업데이트한다
   */
  기준내용업데이트한다(criteria: string, updatedBy: string): void {
    this.criteria = criteria;
    this.수정자를_설정한다(updatedBy);
    this.메타데이터를_업데이트한다();
  }

  /**
   * 평가 기준이 특정 WBS 항목에 속하는지 확인한다
   */
  WBS항목일치하는가(wbsItemId: string): boolean {
    return this.wbsItemId === wbsItemId;
  }

  /**
   * 평가 기준이 유효한지 확인한다
   */
  유효한가(): boolean {
    return (
      this.wbsItemId !== undefined &&
      this.wbsItemId.trim() !== '' &&
      this.criteria !== undefined &&
      this.criteria.trim() !== ''
    );
  }

  /**
   * 평가 기준 내용이 비어있지 않은지 확인한다
   */
  기준내용이_유효한가(): boolean {
    return this.criteria !== undefined && this.criteria.trim().length > 0;
  }

  /**
   * WBS 항목 ID가 유효한지 확인한다
   */
  WBS항목ID가_유효한가(): boolean {
    return this.wbsItemId !== undefined && this.wbsItemId.trim().length > 0;
  }

  /**
   * 동일한 평가 기준인지 확인한다
   */
  동일한_평가기준인가(wbsItemId: string, criteria: string): boolean {
    return (
      this.wbsItemId === wbsItemId && this.criteria.trim() === criteria.trim()
    );
  }
}
