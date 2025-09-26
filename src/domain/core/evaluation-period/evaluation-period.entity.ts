import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import {
  EvaluationPeriodStatus,
  EvaluationPeriodPhase,
  EvaluationPeriodDto,
} from './evaluation-period.types';
import { IEvaluationPeriod } from './interfaces/evaluation-period.interface';
import {
  InvalidEvaluationPeriodStatusTransitionException,
  EvaluationPeriodBusinessRuleViolationException,
  EvaluationPeriodRequiredDataMissingException,
  InvalidEvaluationPeriodDataFormatException,
  InvalidEvaluationPeriodDateRangeException,
  InvalidSelfEvaluationRateException,
  SelfEvaluationRateSettingNotAllowedException,
} from './evaluation-period.exceptions';

/**
 * 평가 기간 엔티티
 *
 * 평가 기간의 기본 정보와 상태를 관리합니다.
 * 평가 기간의 생명주기와 각 단계별 일정을 추적합니다.
 */
@Entity('evaluation_period')
@Index(['name'], { unique: true })
@Index(['status'])
@Index(['currentPhase'])
@Index(['startDate'])
@Index(['endDate'])
@Index(['maxSelfEvaluationRate'])
export class EvaluationPeriod
  extends BaseEntity<EvaluationPeriodDto>
  implements IEvaluationPeriod
{
  @Column({
    type: 'varchar',
    length: 255,
    comment: '평가 기간명',
  })
  name: string;

  @Column({
    type: 'date',
    comment: '평가 기간 시작일',
  })
  startDate: Date;

  @Column({
    type: 'date',
    comment: '평가 기간 종료일',
  })
  endDate: Date;

  @Column({
    type: 'text',
    nullable: true,
    comment: '평가 기간 설명',
  })
  description?: string;

  @Column({
    type: 'enum',
    enum: [
      'inactive',
      'criteria-setting',
      'active',
      'performance-input',
      'final-evaluation',
      'completed',
    ],
    default: 'inactive',
    comment: '평가 기간 상태',
  })
  status: EvaluationPeriodStatus;

  @Column({
    type: 'enum',
    enum: [
      'criteria-setting',
      'active',
      'performance-input',
      'final-evaluation',
    ],
    nullable: true,
    comment: '현재 진행 단계',
  })
  currentPhase?: EvaluationPeriodPhase;

  @Column({
    type: 'date',
    nullable: true,
    comment: '평가 기준 설정 시작일',
  })
  criteriaStartDate?: Date;

  @Column({
    type: 'date',
    nullable: true,
    comment: '평가 기준 설정 종료일',
  })
  criteriaEndDate?: Date;

  @Column({
    type: 'date',
    nullable: true,
    comment: '성과 입력 시작일',
  })
  performanceStartDate?: Date;

  @Column({
    type: 'date',
    nullable: true,
    comment: '성과 입력 종료일',
  })
  performanceEndDate?: Date;

  @Column({
    type: 'date',
    nullable: true,
    comment: '최종 평가 시작일',
  })
  finalEvaluationStartDate?: Date;

  @Column({
    type: 'date',
    nullable: true,
    comment: '최종 평가 종료일',
  })
  finalEvaluationEndDate?: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: '평가 완료일',
  })
  completedDate?: Date;

  @Column({
    type: 'boolean',
    default: false,
    comment: '평가 기준 설정 수동 허용 여부',
  })
  criteriaSettingEnabled: boolean;

  @Column({
    type: 'boolean',
    default: false,
    comment: '자기 평가 설정 수동 허용 여부',
  })
  selfEvaluationSettingEnabled: boolean;

  @Column({
    type: 'boolean',
    default: false,
    comment: '하향/동료평가 설정 수동 허용 여부',
  })
  finalEvaluationSettingEnabled: boolean;

  @Column({
    type: 'int',
    default: 120,
    comment: '자기평가 달성률 최대값 (%)',
  })
  maxSelfEvaluationRate: number;

  /**
   * 평가 기간을 시작한다
   * @param startedBy 시작한 사용자 ID
   * @throws InvalidEvaluationPeriodStatusTransitionException 비활성 상태가 아닌 경우
   */
  평가기간시작한다(startedBy: string): void {
    if (!this.시작가능한가()) {
      throw new InvalidEvaluationPeriodStatusTransitionException(
        this.status,
        EvaluationPeriodStatus.ACTIVE,
        '평가 기간은 비활성 상태에서만 시작할 수 있습니다.',
      );
    }

    this.status = EvaluationPeriodStatus.ACTIVE;
    this.currentPhase = EvaluationPeriodPhase.CRITERIA_SETTING;
    this.updatedBy = startedBy;
    this.updatedAt = new Date();
  }

  /**
   * 평가 기간을 완료한다
   * @param completedBy 완료한 사용자 ID
   * @throws InvalidEvaluationPeriodStatusTransitionException 최종 평가 상태가 아닌 경우
   */
  평가기간완료한다(completedBy: string): void {
    if (!this.완료가능한가()) {
      throw new InvalidEvaluationPeriodStatusTransitionException(
        this.status,
        EvaluationPeriodStatus.COMPLETED,
        '평가 기간은 최종 평가 상태에서만 완료할 수 있습니다.',
      );
    }

    this.status = EvaluationPeriodStatus.COMPLETED;
    this.currentPhase = undefined;
    this.completedDate = new Date();
    this.updatedBy = completedBy;
    this.updatedAt = new Date();
  }

  /**
   * 평가 기준 설정 단계로 이동한다
   * @param movedBy 이동한 사용자 ID
   */
  평가기준설정단계이동한다(movedBy: string): void {
    if (!this.단계전이유효한가(EvaluationPeriodPhase.CRITERIA_SETTING)) {
      throw new InvalidEvaluationPeriodStatusTransitionException(
        this.status,
        EvaluationPeriodStatus.CRITERIA_SETTING,
        '평가 기준 설정 단계로 이동할 수 없습니다.',
      );
    }

    this.status = EvaluationPeriodStatus.CRITERIA_SETTING;
    this.currentPhase = EvaluationPeriodPhase.CRITERIA_SETTING;
    this.updatedBy = movedBy;
    this.updatedAt = new Date();
  }

  /**
   * 성과 입력 단계로 이동한다
   * @param movedBy 이동한 사용자 ID
   */
  성과입력단계이동한다(movedBy: string): void {
    if (!this.단계전이유효한가(EvaluationPeriodPhase.PERFORMANCE_INPUT)) {
      throw new InvalidEvaluationPeriodStatusTransitionException(
        this.status,
        EvaluationPeriodStatus.PERFORMANCE_INPUT,
        '성과 입력 단계로 이동할 수 없습니다.',
      );
    }

    this.status = EvaluationPeriodStatus.PERFORMANCE_INPUT;
    this.currentPhase = EvaluationPeriodPhase.PERFORMANCE_INPUT;
    this.updatedBy = movedBy;
    this.updatedAt = new Date();
  }

  /**
   * 최종 평가 단계로 이동한다
   * @param movedBy 이동한 사용자 ID
   */
  최종평가단계이동한다(movedBy: string): void {
    if (!this.단계전이유효한가(EvaluationPeriodPhase.FINAL_EVALUATION)) {
      throw new InvalidEvaluationPeriodStatusTransitionException(
        this.status,
        EvaluationPeriodStatus.FINAL_EVALUATION,
        '최종 평가 단계로 이동할 수 없습니다.',
      );
    }

    this.status = EvaluationPeriodStatus.FINAL_EVALUATION;
    this.currentPhase = EvaluationPeriodPhase.FINAL_EVALUATION;
    this.updatedBy = movedBy;
    this.updatedAt = new Date();
  }

  /**
   * 평가 기준 설정 수동 허용을 활성화한다
   * @param enabledBy 활성화한 사용자 ID
   */
  평가기준설정수동허용활성화한다(enabledBy: string): void {
    this.criteriaSettingEnabled = true;
    this.updatedBy = enabledBy;
    this.updatedAt = new Date();
  }

  /**
   * 자기 평가 설정 수동 허용을 활성화한다
   * @param enabledBy 활성화한 사용자 ID
   */
  자기평가설정수동허용활성화한다(enabledBy: string): void {
    this.selfEvaluationSettingEnabled = true;
    this.updatedBy = enabledBy;
    this.updatedAt = new Date();
  }

  /**
   * 최종 평가 설정 수동 허용을 활성화한다
   * @param enabledBy 활성화한 사용자 ID
   */
  최종평가설정수동허용활성화한다(enabledBy: string): void {
    this.finalEvaluationSettingEnabled = true;
    this.updatedBy = enabledBy;
    this.updatedAt = new Date();
  }

  /**
   * 자기평가 달성률 최대값을 설정한다
   * @param maxRate 최대 달성률 (%)
   * @param setBy 설정한 사용자 ID
   */
  자기평가달성률최대값설정한다(maxRate: number, setBy: string): void {
    if (!this.자기평가달성률유효한가(maxRate)) {
      throw new InvalidSelfEvaluationRateException(maxRate);
    }

    if (this.status === EvaluationPeriodStatus.COMPLETED) {
      throw new SelfEvaluationRateSettingNotAllowedException(
        this.id,
        this.status,
        '완료된 평가 기간의 달성률은 변경할 수 없습니다.',
      );
    }

    this.maxSelfEvaluationRate = maxRate;
    this.updatedBy = setBy;
    this.updatedAt = new Date();
  }

  /**
   * 현재 상태가 시작 가능한지 확인한다
   * @returns 시작 가능 여부
   */
  시작가능한가(): boolean {
    return this.status === EvaluationPeriodStatus.INACTIVE;
  }

  /**
   * 현재 상태가 완료 가능한지 확인한다
   * @returns 완료 가능 여부
   */
  완료가능한가(): boolean {
    return this.status === EvaluationPeriodStatus.FINAL_EVALUATION;
  }

  /**
   * 현재 상태가 활성화된 상태인지 확인한다
   * @returns 활성화 상태 여부
   */
  활성화됨(): boolean {
    return [
      EvaluationPeriodStatus.ACTIVE,
      EvaluationPeriodStatus.CRITERIA_SETTING,
      EvaluationPeriodStatus.PERFORMANCE_INPUT,
      EvaluationPeriodStatus.FINAL_EVALUATION,
    ].includes(this.status);
  }

  /**
   * 현재 상태가 완료된 상태인지 확인한다
   * @returns 완료 상태 여부
   */
  완료됨(): boolean {
    return this.status === EvaluationPeriodStatus.COMPLETED;
  }

  /**
   * 평가 기준 설정 기간인지 확인한다
   * @returns 평가 기준 설정 기간 여부
   */
  평가기준설정기간인가(): boolean {
    return this.status === EvaluationPeriodStatus.CRITERIA_SETTING;
  }

  /**
   * 성과 입력 기간인지 확인한다
   * @returns 성과 입력 기간 여부
   */
  성과입력기간인가(): boolean {
    return this.status === EvaluationPeriodStatus.PERFORMANCE_INPUT;
  }

  /**
   * 최종 평가 기간인지 확인한다
   * @returns 최종 평가 기간 여부
   */
  최종평가기간인가(): boolean {
    return this.status === EvaluationPeriodStatus.FINAL_EVALUATION;
  }

  /**
   * 현재 날짜가 평가 기간 내인지 확인한다
   * @returns 평가 기간 내 여부
   */
  평가기간내인가(): boolean {
    const now = new Date();
    return now >= this.startDate && now <= this.endDate;
  }

  /**
   * 평가 기간이 만료되었는지 확인한다
   * @returns 만료 여부
   */
  만료됨(): boolean {
    const now = new Date();
    return now > this.endDate;
  }

  /**
   * 상태 전이가 유효한지 확인한다
   * @param targetStatus 목표 상태
   * @returns 유효한 전이 여부
   */
  상태전이유효한가(targetStatus: EvaluationPeriodStatus): boolean {
    const validTransitions: Record<
      EvaluationPeriodStatus,
      EvaluationPeriodStatus[]
    > = {
      [EvaluationPeriodStatus.INACTIVE]: [
        EvaluationPeriodStatus.ACTIVE,
        EvaluationPeriodStatus.CRITERIA_SETTING,
      ],
      [EvaluationPeriodStatus.CRITERIA_SETTING]: [
        EvaluationPeriodStatus.ACTIVE,
        EvaluationPeriodStatus.PERFORMANCE_INPUT,
      ],
      [EvaluationPeriodStatus.ACTIVE]: [
        EvaluationPeriodStatus.PERFORMANCE_INPUT,
        EvaluationPeriodStatus.CRITERIA_SETTING,
      ],
      [EvaluationPeriodStatus.PERFORMANCE_INPUT]: [
        EvaluationPeriodStatus.FINAL_EVALUATION,
        EvaluationPeriodStatus.ACTIVE,
      ],
      [EvaluationPeriodStatus.FINAL_EVALUATION]: [
        EvaluationPeriodStatus.COMPLETED,
      ],
      [EvaluationPeriodStatus.COMPLETED]: [],
    };

    return validTransitions[this.status]?.includes(targetStatus) ?? false;
  }

  /**
   * 단계 전이가 유효한지 확인한다
   * @param targetPhase 목표 단계
   * @returns 유효한 전이 여부
   */
  단계전이유효한가(targetPhase: EvaluationPeriodPhase): boolean {
    const validPhaseTransitions: Record<
      EvaluationPeriodPhase,
      EvaluationPeriodPhase[]
    > = {
      [EvaluationPeriodPhase.CRITERIA_SETTING]: [
        EvaluationPeriodPhase.ACTIVE,
        EvaluationPeriodPhase.PERFORMANCE_INPUT,
      ],
      [EvaluationPeriodPhase.ACTIVE]: [
        EvaluationPeriodPhase.CRITERIA_SETTING,
        EvaluationPeriodPhase.PERFORMANCE_INPUT,
      ],
      [EvaluationPeriodPhase.PERFORMANCE_INPUT]: [
        EvaluationPeriodPhase.FINAL_EVALUATION,
        EvaluationPeriodPhase.ACTIVE,
      ],
      [EvaluationPeriodPhase.FINAL_EVALUATION]: [],
    };

    if (!this.currentPhase) {
      return targetPhase === EvaluationPeriodPhase.CRITERIA_SETTING;
    }

    return (
      validPhaseTransitions[this.currentPhase]?.includes(targetPhase) ?? false
    );
  }

  /**
   * 자기평가 달성률이 유효한지 확인한다
   * @param rate 확인할 달성률
   * @returns 유효성 여부
   */
  자기평가달성률유효한가(rate: number): boolean {
    return rate >= 0 && rate <= 200 && Number.isInteger(rate);
  }

  /**
   * 자기평가 달성률 최대값을 반환한다
   * @returns 최대 달성률 (%)
   */
  자기평가달성률최대값(): number {
    return this.maxSelfEvaluationRate;
  }

  /**
   * 평가 기간 정보를 업데이트한다
   * @param name 새로운 평가 기간명
   * @param description 새로운 설명
   * @param updatedBy 수정자 ID
   */
  정보업데이트한다(
    name?: string,
    description?: string,
    updatedBy?: string,
  ): void {
    if (name !== undefined) {
      if (!name.trim()) {
        throw new EvaluationPeriodRequiredDataMissingException(
          '평가 기간명은 필수입니다.',
        );
      }
      this.name = name.trim();
    }

    if (description !== undefined) {
      this.description = description.trim() || undefined;
    }

    if (updatedBy) {
      this.updatedBy = updatedBy;
    }
    this.updatedAt = new Date();
  }

  /**
   * 평가 기간 일정을 업데이트한다
   * @param startDate 새로운 시작일
   * @param endDate 새로운 종료일
   * @param updatedBy 수정자 ID
   */
  일정업데이트한다(startDate?: Date, endDate?: Date, updatedBy?: string): void {
    const newStartDate = startDate || this.startDate;
    const newEndDate = endDate || this.endDate;

    if (newStartDate >= newEndDate) {
      throw new InvalidEvaluationPeriodDateRangeException(
        '시작일은 종료일보다 이전이어야 합니다.',
      );
    }

    if (startDate) this.startDate = startDate;
    if (endDate) this.endDate = endDate;

    if (updatedBy) {
      this.updatedBy = updatedBy;
    }
    this.updatedAt = new Date();
  }

  /**
   * 세부 일정을 업데이트한다
   * @param criteriaStartDate 평가 기준 설정 시작일
   * @param criteriaEndDate 평가 기준 설정 종료일
   * @param performanceStartDate 성과 입력 시작일
   * @param performanceEndDate 성과 입력 종료일
   * @param finalEvaluationStartDate 최종 평가 시작일
   * @param finalEvaluationEndDate 최종 평가 종료일
   * @param updatedBy 수정자 ID
   */
  세부일정업데이트한다(
    criteriaStartDate?: Date,
    criteriaEndDate?: Date,
    performanceStartDate?: Date,
    performanceEndDate?: Date,
    finalEvaluationStartDate?: Date,
    finalEvaluationEndDate?: Date,
    updatedBy?: string,
  ): void {
    // 날짜 유효성 검증
    if (
      criteriaStartDate &&
      criteriaEndDate &&
      criteriaStartDate >= criteriaEndDate
    ) {
      throw new InvalidEvaluationPeriodDateRangeException(
        '평가 기준 설정 시작일은 종료일보다 이전이어야 합니다.',
      );
    }

    if (
      performanceStartDate &&
      performanceEndDate &&
      performanceStartDate >= performanceEndDate
    ) {
      throw new InvalidEvaluationPeriodDateRangeException(
        '성과 입력 시작일은 종료일보다 이전이어야 합니다.',
      );
    }

    if (
      finalEvaluationStartDate &&
      finalEvaluationEndDate &&
      finalEvaluationStartDate >= finalEvaluationEndDate
    ) {
      throw new InvalidEvaluationPeriodDateRangeException(
        '최종 평가 시작일은 종료일보다 이전이어야 합니다.',
      );
    }

    // 일정 업데이트
    if (criteriaStartDate !== undefined)
      this.criteriaStartDate = criteriaStartDate;
    if (criteriaEndDate !== undefined) this.criteriaEndDate = criteriaEndDate;
    if (performanceStartDate !== undefined)
      this.performanceStartDate = performanceStartDate;
    if (performanceEndDate !== undefined)
      this.performanceEndDate = performanceEndDate;
    if (finalEvaluationStartDate !== undefined)
      this.finalEvaluationStartDate = finalEvaluationStartDate;
    if (finalEvaluationEndDate !== undefined)
      this.finalEvaluationEndDate = finalEvaluationEndDate;

    if (updatedBy) {
      this.updatedBy = updatedBy;
    }
    this.updatedAt = new Date();
  }

  /**
   * 평가 기간을 DTO로 변환한다
   * @returns 평가 기간 DTO 객체
   */
  DTO변환한다(): EvaluationPeriodDto {
    return {
      id: this.id,
      name: this.name,
      startDate: this.startDate,
      endDate: this.endDate,
      description: this.description,
      status: this.status,
      currentPhase: this.currentPhase,
      criteriaStartDate: this.criteriaStartDate,
      criteriaEndDate: this.criteriaEndDate,
      performanceStartDate: this.performanceStartDate,
      performanceEndDate: this.performanceEndDate,
      finalEvaluationStartDate: this.finalEvaluationStartDate,
      finalEvaluationEndDate: this.finalEvaluationEndDate,
      completedDate: this.completedDate,
      criteriaSettingEnabled: this.criteriaSettingEnabled,
      selfEvaluationSettingEnabled: this.selfEvaluationSettingEnabled,
      finalEvaluationSettingEnabled: this.finalEvaluationSettingEnabled,
      maxSelfEvaluationRate: this.maxSelfEvaluationRate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
