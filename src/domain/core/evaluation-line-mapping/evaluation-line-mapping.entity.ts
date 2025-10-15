import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import { IEvaluationLineMapping } from './interfaces/evaluation-line-mapping.interface';
import { EvaluationLineMappingDto } from './evaluation-line-mapping.types';

/**
 * 평가 라인 맵핑 엔티티
 * 실제 평가 관계(피평가자-평가자)를 평가 라인과 연결하는 엔티티입니다.
 */
@Entity('evaluation_line_mappings')
export class EvaluationLineMapping
  extends BaseEntity<EvaluationLineMappingDto>
  implements IEvaluationLineMapping
{
  /**
   * 피평가자 ID
   * 평가를 받는 직원의 식별자입니다.
   */
  @Column({
    type: 'uuid',
    comment: '피평가자 ID - 평가를 받는 직원 식별자',
  })
  employeeId: string;

  /**
   * 평가자 ID
   * 평가를 수행하는 직원의 식별자입니다.
   */
  @Column({
    type: 'uuid',
    comment: '평가자 ID - 평가를 수행하는 직원 식별자',
  })
  evaluatorId: string;

  /**
   * WBS 항목 ID (선택적)
   * 특정 WBS 항목 컨텍스트에서의 평가인 경우 사용됩니다.
   */
  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'WBS 항목 ID - 평가가 수행되는 WBS 항목 식별자 (선택적)',
  })
  wbsItemId?: string;

  /**
   * 평가 라인 ID
   * 연결된 평가 라인의 식별자입니다.
   */
  @Column({
    type: 'uuid',
    comment: '평가 라인 ID - 실제 평가 라인 엔티티 식별자',
  })
  evaluationLineId: string;

  /**
   * DTO로 변환
   */
  DTO로_변환한다(): EvaluationLineMappingDto {
    return {
      id: this.id,
      employeeId: this.employeeId,
      evaluatorId: this.evaluatorId,
      wbsItemId: this.wbsItemId,
      evaluationLineId: this.evaluationLineId,
      createdBy: this.createdBy,
      updatedBy: this.updatedBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * 평가자를 변경한다
   */
  평가자를_변경한다(evaluatorId: string): void {
    this.evaluatorId = evaluatorId;
    this.메타데이터를_업데이트한다();
  }

  /**
   * 평가 라인을 변경한다
   */
  평가라인을_변경한다(evaluationLineId: string): void {
    this.evaluationLineId = evaluationLineId;
    this.메타데이터를_업데이트한다();
  }

  /**
   * WBS 항목을 변경한다
   */
  WBS항목을_변경한다(wbsItemId?: string): void {
    this.wbsItemId = wbsItemId;
    this.메타데이터를_업데이트한다();
  }

  /**
   * 맵핑이 유효한지 검증한다
   */
  유효성을_검증한다(): boolean {
    return (
      this.employeeId !== undefined &&
      this.evaluatorId !== undefined &&
      this.evaluationLineId !== undefined &&
      this.employeeId !== this.evaluatorId // 자기 자신을 평가할 수 없음
    );
  }

  /**
   * WBS 기반 평가인지 확인한다
   */
  WBS_기반_평가인가(): boolean {
    return this.wbsItemId !== undefined && this.wbsItemId !== null;
  }

  /**
   * 동일한 평가 관계인지 확인한다
   */
  동일한_평가관계인가(
    employeeId: string,
    evaluatorId: string,
    wbsItemId?: string,
  ): boolean {
    return (
      this.employeeId === employeeId &&
      this.evaluatorId === evaluatorId &&
      this.wbsItemId === wbsItemId
    );
  }
}
