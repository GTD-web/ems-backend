import { BaseEntity } from '@libs/database/base/base.entity';
import { Transform } from 'class-transformer';
import { Column, Entity, Index } from 'typeorm';
import {
  EvaluationPeriodBusinessRuleViolationException,
  EvaluationPeriodRequiredDataMissingException,
  InvalidEvaluationPeriodDateRangeException,
  InvalidEvaluationPeriodStatusTransitionException,
  InvalidSelfEvaluationRateException,
  SelfEvaluationRateSettingNotAllowedException,
} from './evaluation-period.exceptions';
import {
  EvaluationPeriodDto,
  EvaluationPeriodPhase,
  EvaluationPeriodStatus,
  GradeRange,
  ScoreGradeMapping,
  SubGradeType,
} from './evaluation-period.types';
import { IEvaluationPeriod } from './interfaces/evaluation-period.interface';

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
    type: 'timestamp',
    comment: '평가 기간 시작일',
  })
  @Transform(({ value }) =>
    value instanceof Date ? value.toISOString() : value,
  )
  startDate: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: '평가 기간 종료일',
  })
  @Transform(({ value }) =>
    value instanceof Date ? value.toISOString() : value,
  )
  endDate?: Date;

  @Column({
    type: 'text',
    nullable: true,
    comment: '평가 기간 설명',
  })
  description?: string;

  @Column({
    type: 'enum',
    enum: [...Object.values(EvaluationPeriodStatus)],
    default: 'waiting',
    comment: '평가 기간 상태',
  })
  status: EvaluationPeriodStatus;

  @Column({
    type: 'enum',
    enum: [...Object.values(EvaluationPeriodPhase)],
    default: 'waiting',
    nullable: true,
    comment: '현재 진행 단계',
  })
  currentPhase?: EvaluationPeriodPhase;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: '평가설정 단계 마감일',
  })
  @Transform(({ value }) =>
    value instanceof Date ? value.toISOString() : value,
  )
  evaluationSetupDeadline?: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: '업무 수행 단계 마감일',
  })
  @Transform(({ value }) =>
    value instanceof Date ? value.toISOString() : value,
  )
  performanceDeadline?: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: '자기 평가 단계 마감일',
  })
  @Transform(({ value }) =>
    value instanceof Date ? value.toISOString() : value,
  )
  selfEvaluationDeadline?: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: '하향/동료평가 단계 마감일',
  })
  @Transform(({ value }) =>
    value instanceof Date ? value.toISOString() : value,
  )
  peerEvaluationDeadline?: Date;

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

  @Column({
    type: 'json',
    nullable: true,
    comment: '등급 구간 설정 (JSON)',
  })
  gradeRanges: GradeRange[];

  /**
   * 평가 기간을 시작한다
   * @param startedBy 시작한 사용자 ID
   * @throws InvalidEvaluationPeriodStatusTransitionException 대기 상태가 아닌 경우
   */
  평가기간_시작한다(startedBy: string): void {
    if (!this.시작_가능한가()) {
      throw new InvalidEvaluationPeriodStatusTransitionException(
        this.status,
        EvaluationPeriodStatus.IN_PROGRESS,
        '평가 기간은 대기 상태에서만 시작할 수 있습니다.',
      );
    }

    this.status = EvaluationPeriodStatus.IN_PROGRESS;
    this.currentPhase = EvaluationPeriodPhase.EVALUATION_SETUP;
    this.updatedBy = startedBy;
    this.updatedAt = new Date();
  }

  /**
   * 평가 기간을 완료한다
   * @param completedBy 완료한 사용자 ID
   * @throws InvalidEvaluationPeriodStatusTransitionException 진행 중 상태가 아닌 경우
   */
  평가기간_완료한다(completedBy: string): void {
    if (!this.완료_가능한가()) {
      throw new InvalidEvaluationPeriodStatusTransitionException(
        this.status,
        EvaluationPeriodStatus.COMPLETED,
        '평가 기간은 진행 중 상태에서만 완료할 수 있습니다.',
      );
    }

    this.status = EvaluationPeriodStatus.COMPLETED;
    this.currentPhase = EvaluationPeriodPhase.CLOSURE;
    this.completedDate = new Date();
    this.updatedBy = completedBy;
    this.updatedAt = new Date();
  }

  /**
   * 평가 기간을 대기 상태로 되돌린다
   * @param resetBy 되돌린 사용자 ID
   * @throws InvalidEvaluationPeriodStatusTransitionException 진행 상태가 아닌 경우
   */
  평가기간_대기상태로_되돌린다(resetBy: string): void {
    if (this.status !== EvaluationPeriodStatus.IN_PROGRESS) {
      throw new InvalidEvaluationPeriodStatusTransitionException(
        this.status,
        EvaluationPeriodStatus.WAITING,
        '진행 중인 평가 기간만 대기 상태로 되돌릴 수 있습니다.',
      );
    }

    this.status = EvaluationPeriodStatus.WAITING;
    this.currentPhase = EvaluationPeriodPhase.WAITING;
    this.updatedBy = resetBy;
    this.updatedAt = new Date();
  }

  /**
   * 평가설정 단계로 이동한다
   * @param movedBy 이동한 사용자 ID
   */
  평가설정_단계로_이동한다(movedBy: string): void {
    if (!this.단계전이_유효한가(EvaluationPeriodPhase.EVALUATION_SETUP)) {
      throw new InvalidEvaluationPeriodStatusTransitionException(
        this.status,
        EvaluationPeriodStatus.IN_PROGRESS,
        '평가설정 단계로 이동할 수 없습니다.',
      );
    }

    this.status = EvaluationPeriodStatus.IN_PROGRESS;
    this.currentPhase = EvaluationPeriodPhase.EVALUATION_SETUP;
    this.updatedBy = movedBy;
    this.updatedAt = new Date();
  }

  /**
   * 업무 수행 단계로 이동한다
   * @param movedBy 이동한 사용자 ID
   */
  업무수행_단계로_이동한다(movedBy: string): void {
    if (!this.단계전이_유효한가(EvaluationPeriodPhase.PERFORMANCE)) {
      throw new InvalidEvaluationPeriodStatusTransitionException(
        this.status,
        EvaluationPeriodStatus.IN_PROGRESS,
        '업무 수행 단계로 이동할 수 없습니다.',
      );
    }

    this.status = EvaluationPeriodStatus.IN_PROGRESS;
    this.currentPhase = EvaluationPeriodPhase.PERFORMANCE;
    this.updatedBy = movedBy;
    this.updatedAt = new Date();
  }

  /**
   * 자기 평가 단계로 이동한다
   * @param movedBy 이동한 사용자 ID
   */
  자기평가_단계로_이동한다(movedBy: string): void {
    if (!this.단계전이_유효한가(EvaluationPeriodPhase.SELF_EVALUATION)) {
      throw new InvalidEvaluationPeriodStatusTransitionException(
        this.status,
        EvaluationPeriodStatus.IN_PROGRESS,
        '자기 평가 단계로 이동할 수 없습니다.',
      );
    }

    this.status = EvaluationPeriodStatus.IN_PROGRESS;
    this.currentPhase = EvaluationPeriodPhase.SELF_EVALUATION;
    this.updatedBy = movedBy;
    this.updatedAt = new Date();
  }

  /**
   * 하향/동료 평가 단계로 이동한다
   * @param movedBy 이동한 사용자 ID
   */
  하향동료평가_단계로_이동한다(movedBy: string): void {
    if (!this.단계전이_유효한가(EvaluationPeriodPhase.PEER_EVALUATION)) {
      throw new InvalidEvaluationPeriodStatusTransitionException(
        this.status,
        EvaluationPeriodStatus.IN_PROGRESS,
        '하향/동료 평가 단계로 이동할 수 없습니다.',
      );
    }

    this.status = EvaluationPeriodStatus.IN_PROGRESS;
    this.currentPhase = EvaluationPeriodPhase.PEER_EVALUATION;
    this.updatedBy = movedBy;
    this.updatedAt = new Date();
  }

  /**
   * 종결 단계로 이동한다
   * @param movedBy 이동한 사용자 ID
   */
  종결_단계로_이동한다(movedBy: string): void {
    if (!this.단계전이_유효한가(EvaluationPeriodPhase.CLOSURE)) {
      throw new InvalidEvaluationPeriodStatusTransitionException(
        this.status,
        EvaluationPeriodStatus.IN_PROGRESS,
        '종결 단계로 이동할 수 없습니다.',
      );
    }

    this.status = EvaluationPeriodStatus.IN_PROGRESS;
    this.currentPhase = EvaluationPeriodPhase.CLOSURE;
    this.updatedBy = movedBy;
    this.updatedAt = new Date();
  }

  /**
   * 평가 기준 설정 수동 허용을 활성화한다
   * @param enabledBy 활성화한 사용자 ID
   */
  평가기준설정_수동허용_활성화한다(enabledBy: string): void {
    this.criteriaSettingEnabled = true;
    this.updatedBy = enabledBy;
    this.updatedAt = new Date();
  }

  /**
   * 자기 평가 설정 수동 허용을 활성화한다
   * @param enabledBy 활성화한 사용자 ID
   */
  자기평가설정_수동허용_활성화한다(enabledBy: string): void {
    this.selfEvaluationSettingEnabled = true;
    this.updatedBy = enabledBy;
    this.updatedAt = new Date();
  }

  /**
   * 최종 평가 설정 수동 허용을 활성화한다
   * @param enabledBy 활성화한 사용자 ID
   */
  최종평가설정_수동허용_활성화한다(enabledBy: string): void {
    this.finalEvaluationSettingEnabled = true;
    this.updatedBy = enabledBy;
    this.updatedAt = new Date();
  }

  /**
   * 자기평가 달성률 최대값을 설정한다
   * @param maxRate 최대 달성률 (%)
   * @param setBy 설정한 사용자 ID
   */
  자기평가_달성률최대값_설정한다(maxRate: number, setBy: string): void {
    if (!this.자기평가_달성률_유효한가(maxRate)) {
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
  시작_가능한가(): boolean {
    return this.status === EvaluationPeriodStatus.WAITING;
  }

  /**
   * 현재 상태가 완료 가능한지 확인한다
   * @returns 완료 가능 여부
   */
  완료_가능한가(): boolean {
    return this.status === EvaluationPeriodStatus.IN_PROGRESS;
  }

  /**
   * 현재 상태가 활성화된 상태인지 확인한다
   * @returns 활성화 상태 여부
   */
  활성화된_상태인가(): boolean {
    return this.status === EvaluationPeriodStatus.IN_PROGRESS;
  }

  /**
   * 현재 상태가 완료된 상태인지 확인한다
   * @returns 완료 상태 여부
   */
  완료된_상태인가(): boolean {
    return this.status === EvaluationPeriodStatus.COMPLETED;
  }

  /**
   * 대기 단계인지 확인한다
   * @returns 대기 단계 여부
   */
  대기_단계인가(): boolean {
    return this.currentPhase === EvaluationPeriodPhase.WAITING;
  }

  /**
   * 평가설정 단계인지 확인한다
   * @returns 평가설정 단계 여부
   */
  평가설정_단계인가(): boolean {
    return this.currentPhase === EvaluationPeriodPhase.EVALUATION_SETUP;
  }

  /**
   * 업무 수행 단계인지 확인한다
   * @returns 업무 수행 단계 여부
   */
  업무수행_단계인가(): boolean {
    return this.currentPhase === EvaluationPeriodPhase.PERFORMANCE;
  }

  /**
   * 자기 평가 단계인지 확인한다
   * @returns 자기 평가 단계 여부
   */
  자기평가_단계인가(): boolean {
    return this.currentPhase === EvaluationPeriodPhase.SELF_EVALUATION;
  }

  /**
   * 하향/동료평가 단계인지 확인한다
   * @returns 하향/동료평가 단계 여부
   */
  하향동료평가_단계인가(): boolean {
    return this.currentPhase === EvaluationPeriodPhase.PEER_EVALUATION;
  }

  /**
   * 종결 단계인지 확인한다
   * @returns 종결 단계 여부
   */
  종결_단계인가(): boolean {
    return this.currentPhase === EvaluationPeriodPhase.CLOSURE;
  }

  /**
   * 현재 날짜가 평가 기간 내인지 확인한다
   * @returns 평가 기간 내 여부
   */
  평가기간_내인가(): boolean {
    const now = new Date();
    return (
      now >= this.startDate && (this.endDate ? now <= this.endDate : false)
    );
  }

  /**
   * 평가 기간이 만료되었는지 확인한다
   * @returns 만료 여부
   */
  만료된_상태인가(): boolean {
    const now = new Date();
    return this.endDate ? now > this.endDate : false;
  }

  /**
   * 상태 전이가 유효한지 확인한다
   * @param targetStatus 목표 상태
   * @returns 유효한 전이 여부
   */
  상태전이_유효한가(targetStatus: EvaluationPeriodStatus): boolean {
    const validTransitions: Record<
      EvaluationPeriodStatus,
      EvaluationPeriodStatus[]
    > = {
      [EvaluationPeriodStatus.WAITING]: [EvaluationPeriodStatus.IN_PROGRESS],
      [EvaluationPeriodStatus.IN_PROGRESS]: [
        EvaluationPeriodStatus.COMPLETED,
        EvaluationPeriodStatus.WAITING,
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
  단계전이_유효한가(targetPhase: EvaluationPeriodPhase): boolean {
    const validPhaseTransitions: Record<
      EvaluationPeriodPhase,
      EvaluationPeriodPhase[]
    > = {
      [EvaluationPeriodPhase.WAITING]: [EvaluationPeriodPhase.EVALUATION_SETUP],
      [EvaluationPeriodPhase.EVALUATION_SETUP]: [
        EvaluationPeriodPhase.PERFORMANCE,
      ],
      [EvaluationPeriodPhase.PERFORMANCE]: [
        EvaluationPeriodPhase.SELF_EVALUATION,
      ],
      [EvaluationPeriodPhase.SELF_EVALUATION]: [
        EvaluationPeriodPhase.PEER_EVALUATION,
      ],
      [EvaluationPeriodPhase.PEER_EVALUATION]: [EvaluationPeriodPhase.CLOSURE],
      [EvaluationPeriodPhase.CLOSURE]: [],
    };

    if (!this.currentPhase) {
      return targetPhase === EvaluationPeriodPhase.EVALUATION_SETUP;
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
  자기평가_달성률_유효한가(rate: number): boolean {
    return rate >= 0 && rate <= 200 && Number.isInteger(rate);
  }

  /**
   * 자기평가 달성률 최대값을 반환한다
   * @returns 최대 달성률 (%)
   */
  자기평가_달성률_최대값(): number {
    return this.maxSelfEvaluationRate;
  }

  /**
   * 평가 기간 정보를 업데이트한다
   * @param name 새로운 평가 기간명
   * @param description 새로운 설명
   * @param updatedBy 수정자 ID
   */
  정보_업데이트한다(
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
  일정_업데이트한다(
    startDate?: Date,
    endDate?: Date,
    updatedBy?: string,
  ): void {
    const newStartDate = startDate || this.startDate;
    const newEndDate = endDate || this.endDate;

    // endDate가 있을 때만 날짜 범위 검증
    if (newEndDate && newStartDate >= newEndDate) {
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
   * 단계별 마감일을 업데이트한다
   * @param evaluationSetupDeadline 평가설정 단계 마감일
   * @param performanceDeadline 업무 수행 단계 마감일
   * @param selfEvaluationDeadline 자기 평가 단계 마감일
   * @param peerEvaluationDeadline 하향/동료평가 단계 마감일
   * @param updatedBy 수정자 ID
   */
  단계별_마감일_업데이트한다(
    evaluationSetupDeadline?: Date,
    performanceDeadline?: Date,
    selfEvaluationDeadline?: Date,
    peerEvaluationDeadline?: Date,
    updatedBy?: string,
  ): void {
    // 마감일 업데이트
    if (evaluationSetupDeadline !== undefined)
      this.evaluationSetupDeadline = evaluationSetupDeadline;
    if (performanceDeadline !== undefined)
      this.performanceDeadline = performanceDeadline;
    if (selfEvaluationDeadline !== undefined)
      this.selfEvaluationDeadline = selfEvaluationDeadline;
    if (peerEvaluationDeadline !== undefined)
      this.peerEvaluationDeadline = peerEvaluationDeadline;

    if (updatedBy) {
      this.updatedBy = updatedBy;
    }
    this.updatedAt = new Date();
  }

  /**
   * 특정 단계의 마감일을 설정한다
   * @param phase 대상 단계
   * @param deadline 마감일
   * @param setBy 설정자 ID
   */
  단계_마감일_설정한다(
    phase: EvaluationPeriodPhase,
    deadline: Date,
    setBy: string,
  ): void {
    switch (phase) {
      case EvaluationPeriodPhase.EVALUATION_SETUP:
        this.evaluationSetupDeadline = deadline;
        break;
      case EvaluationPeriodPhase.PERFORMANCE:
        this.performanceDeadline = deadline;
        break;
      case EvaluationPeriodPhase.SELF_EVALUATION:
        this.selfEvaluationDeadline = deadline;
        break;
      case EvaluationPeriodPhase.PEER_EVALUATION:
        this.peerEvaluationDeadline = deadline;
        break;
      default:
        throw new Error(`지원하지 않는 단계입니다: ${phase}`);
    }

    this.updatedBy = setBy;
    this.updatedAt = new Date();
  }

  /**
   * 특정 단계의 마감일을 조회한다
   * @param phase 대상 단계
   * @returns 해당 단계의 마감일
   */
  단계_마감일_조회한다(phase: EvaluationPeriodPhase): Date | null {
    switch (phase) {
      case EvaluationPeriodPhase.EVALUATION_SETUP:
        return this.evaluationSetupDeadline || null;
      case EvaluationPeriodPhase.PERFORMANCE:
        return this.performanceDeadline || null;
      case EvaluationPeriodPhase.SELF_EVALUATION:
        return this.selfEvaluationDeadline || null;
      case EvaluationPeriodPhase.PEER_EVALUATION:
        return this.peerEvaluationDeadline || null;
      default:
        return null;
    }
  }

  /**
   * 특정 단계가 마감되었는지 확인한다
   * @param phase 대상 단계
   * @returns 마감 여부
   */
  단계_마감된_상태인가(phase: EvaluationPeriodPhase): boolean {
    const deadline = this.단계_마감일_조회한다(phase);
    if (!deadline) return false;

    const now = new Date();
    return now > deadline;
  }

  /**
   * 평가 기간을 DTO로 변환한다
   * @returns 평가 기간 DTO 객체
   */
  // ==================== 등급 구간 관리 ====================

  /**
   * 등급 구간을 설정한다
   */
  등급구간_설정한다(gradeRanges: GradeRange[], setBy: string): void {
    this.등급구간_유효성_검증한다(gradeRanges);
    this.gradeRanges = [...gradeRanges].sort((a, b) => b.minRange - a.minRange);
    this.updatedBy = setBy;
    this.updatedAt = new Date();
  }

  /**
   * 점수에 해당하는 등급을 조회한다
   */
  점수로_등급_조회한다(score: number): ScoreGradeMapping | null {
    if (!this.gradeRanges || this.gradeRanges.length === 0) {
      return null;
    }

    const gradeRange = this.gradeRanges.find(
      (range) => score >= range.minRange && score <= range.maxRange,
    );

    if (!gradeRange) {
      return null;
    }

    // 세부 등급 계산
    let subGrade: SubGradeType = SubGradeType.NONE;
    let finalGrade: string = gradeRange.grade;

    if (gradeRange.subGrades && gradeRange.subGrades.length > 0) {
      const subGradeInfo = gradeRange.subGrades.find(
        (sub) => score >= sub.minRange && score <= sub.maxRange,
      );
      if (subGradeInfo) {
        subGrade = subGradeInfo.type;
        finalGrade = `${gradeRange.grade}${
          subGrade === SubGradeType.PLUS
            ? '+'
            : subGrade === SubGradeType.MINUS
              ? '-'
              : ''
        }`;
      }
    }

    return {
      score,
      grade: gradeRange.grade,
      subGrade,
      finalGrade,
    };
  }

  /**
   * 등급 구간 유효성을 검증한다
   */
  private 등급구간_유효성_검증한다(gradeRanges: GradeRange[]): void {
    if (!gradeRanges || gradeRanges.length === 0) {
      throw new EvaluationPeriodBusinessRuleViolationException(
        '등급 구간은 최소 1개 이상 설정되어야 합니다.',
      );
    }

    // 등급 중복 검증
    const grades = gradeRanges.map((range) => range.grade);
    const uniqueGrades = new Set(grades);
    if (grades.length !== uniqueGrades.size) {
      throw new EvaluationPeriodBusinessRuleViolationException(
        '중복된 등급이 존재합니다.',
      );
    }

    // 점수 범위 검증
    for (const range of gradeRanges) {
      if (range.minRange >= range.maxRange) {
        throw new EvaluationPeriodBusinessRuleViolationException(
          `등급 ${range.grade}의 최소 범위는 최대 범위보다 작아야 합니다.`,
        );
      }
      if (range.minRange < 0 || range.maxRange > 100) {
        throw new EvaluationPeriodBusinessRuleViolationException(
          `등급 ${range.grade}의 점수 범위는 0-100 사이여야 합니다.`,
        );
      }
    }

    // 범위 겹침 검증
    const sortedRanges = [...gradeRanges].sort(
      (a, b) => a.minRange - b.minRange,
    );
    for (let i = 0; i < sortedRanges.length - 1; i++) {
      const current = sortedRanges[i];
      const next = sortedRanges[i + 1];
      if (current.maxRange >= next.minRange) {
        throw new EvaluationPeriodBusinessRuleViolationException(
          `등급 ${current.grade}와 ${next.grade}의 점수 범위가 겹칩니다.`,
        );
      }
    }
  }

  /**
   * 등급 구간이 설정되어 있는지 확인한다
   */
  등급구간_설정됨(): boolean {
    return this.gradeRanges && this.gradeRanges.length > 0;
  }

  /**
   * 특정 등급의 구간 정보를 조회한다
   */
  등급구간_조회한다(grade: string): GradeRange | null {
    if (!this.gradeRanges) {
      return null;
    }
    return this.gradeRanges.find((range) => range.grade === grade) || null;
  }

  DTO_변환한다(): EvaluationPeriodDto {
    return {
      id: this.id,
      name: this.name,
      startDate: this.startDate,
      endDate: this.endDate,
      description: this.description,
      status: this.status,
      currentPhase: this.currentPhase,
      evaluationSetupDeadline: this.evaluationSetupDeadline,
      performanceDeadline: this.performanceDeadline,
      selfEvaluationDeadline: this.selfEvaluationDeadline,
      peerEvaluationDeadline: this.peerEvaluationDeadline,
      completedDate: this.completedDate,
      criteriaSettingEnabled: this.criteriaSettingEnabled,
      selfEvaluationSettingEnabled: this.selfEvaluationSettingEnabled,
      finalEvaluationSettingEnabled: this.finalEvaluationSettingEnabled,
      maxSelfEvaluationRate: this.maxSelfEvaluationRate,
      gradeRanges: this.gradeRanges || [],
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * BaseEntity의 추상 메서드 구현 (하위 호환성)
   * @returns 평가 기간 DTO 객체
   */
  DTO로_변환한다(): EvaluationPeriodDto {
    return this.DTO_변환한다();
  }
}
