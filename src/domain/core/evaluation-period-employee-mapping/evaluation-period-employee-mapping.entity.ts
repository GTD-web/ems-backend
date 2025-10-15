import { Entity, Column, Index, Unique } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import { IEvaluationPeriodEmployeeMapping } from './interfaces/evaluation-period-employee-mapping.interface';
import type {
  EvaluationPeriodEmployeeMappingDto,
  CreateEvaluationPeriodEmployeeMappingData,
} from './evaluation-period-employee-mapping.types';

/**
 * 평가기간-직원 맵핑 엔티티
 * 평가기간별 평가 대상자를 관리합니다.
 */
@Entity('evaluation_period_employee_mapping')
@Index(['evaluationPeriodId'])
@Index(['employeeId'])
@Index(['isExcluded'])
@Index(['evaluationPeriodId', 'employeeId'])
@Unique(['evaluationPeriodId', 'employeeId'])
export class EvaluationPeriodEmployeeMapping
  extends BaseEntity<EvaluationPeriodEmployeeMappingDto>
  implements IEvaluationPeriodEmployeeMapping
{
  @Column({
    type: 'uuid',
    comment: '평가기간 ID',
  })
  evaluationPeriodId: string;

  @Column({
    type: 'uuid',
    comment: '직원 ID',
  })
  employeeId: string;

  @Column({
    type: 'boolean',
    default: false,
    comment: '평가 대상 제외 여부',
  })
  isExcluded: boolean;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: '평가 대상 제외 사유',
  })
  excludeReason?: string | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: '제외 처리자 ID',
  })
  excludedBy?: string | null;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: '제외 처리 일시',
  })
  excludedAt?: Date | null;

  constructor(data?: CreateEvaluationPeriodEmployeeMappingData) {
    super();
    if (data) {
      this.evaluationPeriodId = data.evaluationPeriodId;
      this.employeeId = data.employeeId;
      this.isExcluded = false;
      this.excludeReason = null;
      this.excludedBy = null;
      this.excludedAt = null;

      // 감사 정보 설정
      this.메타데이터를_업데이트한다(data.createdBy);
    }
  }

  /**
   * 특정 평가기간의 맵핑인지 확인한다
   */
  해당_평가기간의_맵핑인가(evaluationPeriodId: string): boolean {
    return this.evaluationPeriodId === evaluationPeriodId;
  }

  /**
   * 특정 직원의 맵핑인지 확인한다
   */
  해당_직원의_맵핑인가(employeeId: string): boolean {
    return this.employeeId === employeeId;
  }

  /**
   * 평가 대상에서 제외되었는지 확인한다
   */
  제외되었는가(): boolean {
    return this.isExcluded;
  }

  /**
   * 평가 대상인지 확인한다 (제외되지 않은 경우)
   */
  평가대상인가(): boolean {
    return !this.isExcluded && !this.삭제되었는가();
  }

  /**
   * 평가 대상에서 제외한다
   */
  평가대상에서_제외한다(excludeReason: string, excludedBy: string): void {
    this.isExcluded = true;
    this.excludeReason = excludeReason;
    this.excludedBy = excludedBy;
    this.excludedAt = new Date();

    this.메타데이터를_업데이트한다(excludedBy);
  }

  /**
   * 평가 대상에 포함한다 (제외 취소)
   */
  평가대상에_포함한다(updatedBy: string): void {
    this.isExcluded = false;
    this.excludeReason = null;
    this.excludedBy = null;
    this.excludedAt = null;

    this.메타데이터를_업데이트한다(updatedBy);
  }

  /**
   * 제외 사유를 수정한다
   */
  제외사유를_수정한다(excludeReason: string, updatedBy: string): void {
    if (!this.isExcluded) {
      throw new Error('제외되지 않은 대상의 제외 사유를 수정할 수 없습니다.');
    }

    this.excludeReason = excludeReason;
    this.메타데이터를_업데이트한다(updatedBy);
  }

  /**
   * 맵핑을 삭제한다 (소프트 삭제)
   */
  삭제한다(): void {
    this.deletedAt = new Date();
  }

  /**
   * DTO로 변환한다
   */
  DTO로_변환한다(): EvaluationPeriodEmployeeMappingDto {
    return {
      id: this.id,
      evaluationPeriodId: this.evaluationPeriodId,
      employeeId: this.employeeId,
      isExcluded: this.isExcluded,
      excludeReason: this.excludeReason,
      excludedBy: this.excludedBy,
      excludedAt: this.excludedAt,
      createdBy: this.createdBy!,
      updatedBy: this.updatedBy!,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }
}

