import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EntityManager,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { EvaluationPeriod } from './evaluation-period.entity';
import {
  EvaluationPeriodBusinessRuleViolationException,
  EvaluationPeriodNameDuplicateException,
  EvaluationPeriodOverlapException,
  EvaluationPeriodRequiredDataMissingException,
  InvalidEvaluationPeriodDataFormatException,
  InvalidEvaluationPeriodDateRangeException,
  InvalidSelfEvaluationRateException,
} from './evaluation-period.exceptions';
import {
  CreateEvaluationPeriodDto,
  EvaluationPeriodPhase,
  EvaluationPeriodStatus,
  UpdateEvaluationPeriodDto,
} from './evaluation-period.types';

/**
 * 평가 기간 유효성 검증 서비스
 * 평가 기간 관련 비즈니스 규칙과 데이터 유효성을 검증합니다.
 */
@Injectable()
export class EvaluationPeriodValidationService {
  private readonly logger = new Logger(EvaluationPeriodValidationService.name);

  constructor(
    @InjectRepository(EvaluationPeriod)
    private readonly evaluationPeriodRepository: Repository<EvaluationPeriod>,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  /**
   * 평가 기간 생성 데이터를 검증한다
   */
  async 생성데이터검증한다(
    createDto: CreateEvaluationPeriodDto,
    manager?: EntityManager,
  ): Promise<void> {
    // 필수 데이터 검증
    this.필수데이터검증한다(createDto);

    // 데이터 형식 검증
    this.데이터형식검증한다(createDto);

    // 날짜 범위 검증 (시작일은 동료평가 마감일보다 이전이어야 함)
    this.날짜범위검증한다(
      createDto.startDate,
      createDto.peerEvaluationDeadline,
    );

    // 세부 일정 검증
    this.세부일정검증한다(createDto);

    // 자기평가 달성률 검증
    if (createDto.maxSelfEvaluationRate !== undefined) {
      this.자기평가달성률검증한다(createDto.maxSelfEvaluationRate);
    }

    // 비즈니스 규칙 검증
    await this.생성비즈니스규칙검증한다(createDto, manager);
  }

  /**
   * 평가 기간 업데이트 데이터를 검증한다
   */
  async 업데이트데이터검증한다(
    id: string,
    updateDto: UpdateEvaluationPeriodDto,
    manager?: EntityManager,
  ): Promise<void> {
    // 기존 평가 기간 조회
    const repository = this.transactionManager.getRepository(
      EvaluationPeriod,
      this.evaluationPeriodRepository,
      manager,
    );
    const existingPeriod = await repository.findOne({ where: { id } });
    if (!existingPeriod) {
      throw new EvaluationPeriodRequiredDataMissingException(
        '존재하지 않는 평가 기간입니다.',
      );
    }

    // 데이터 형식 검증
    if (updateDto.name !== undefined) {
      this.이름형식검증한다(updateDto.name);
    }

    // 날짜 범위 검증 (시작일은 동료평가 마감일보다 이전이어야 함)
    if (updateDto.startDate || updateDto.peerEvaluationDeadline) {
      const newStartDate = updateDto.startDate || existingPeriod.startDate;
      const newPeerEvaluationDeadline =
        updateDto.peerEvaluationDeadline ||
        existingPeriod.peerEvaluationDeadline;
      this.날짜범위검증한다(newStartDate, newPeerEvaluationDeadline);
    }

    // 세부 일정 검증
    this.세부일정업데이트검증한다(updateDto, existingPeriod);

    // 자기평가 달성률 검증
    if (updateDto.maxSelfEvaluationRate !== undefined) {
      this.자기평가달성률검증한다(updateDto.maxSelfEvaluationRate);
    }

    // 비즈니스 규칙 검증
    await this.업데이트비즈니스규칙검증한다(
      id,
      updateDto,
      existingPeriod,
      manager,
    );
  }

  /**
   * 상태 전이를 검증한다
   */
  상태전이검증한다(
    currentStatus: EvaluationPeriodStatus,
    targetStatus: EvaluationPeriodStatus,
  ): void {
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

    const allowedTransitions = validTransitions[currentStatus] || [];
    if (!allowedTransitions.includes(targetStatus)) {
      throw new EvaluationPeriodBusinessRuleViolationException(
        `${currentStatus}에서 ${targetStatus}로 상태 전이가 불가능합니다.`,
      );
    }
  }

  /**
   * 단계 전이를 검증한다
   */
  단계전이검증한다(
    currentPhase: EvaluationPeriodPhase | undefined,
    targetPhase: EvaluationPeriodPhase,
  ): void {
    if (!currentPhase) {
      if (targetPhase !== EvaluationPeriodPhase.EVALUATION_SETUP) {
        throw new EvaluationPeriodBusinessRuleViolationException(
          '첫 번째 단계는 평가설정이어야 합니다.',
        );
      }
      return;
    }

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

    const allowedTransitions = validPhaseTransitions[currentPhase] || [];
    if (!allowedTransitions.includes(targetPhase)) {
      throw new EvaluationPeriodBusinessRuleViolationException(
        `${currentPhase}에서 ${targetPhase}로 단계 전이가 불가능합니다.`,
      );
    }
  }

  /**
   * 필수 데이터를 검증한다
   */
  private 필수데이터검증한다(createDto: CreateEvaluationPeriodDto): void {
    if (!createDto.name?.trim()) {
      throw new EvaluationPeriodRequiredDataMissingException(
        '평가 기간명은 필수입니다.',
      );
    }

    if (!createDto.startDate) {
      throw new EvaluationPeriodRequiredDataMissingException(
        '시작일은 필수입니다.',
      );
    }

    // endDate는 제거되었으므로 검증 불필요
  }

  /**
   * 데이터 형식을 검증한다
   */
  private 데이터형식검증한다(
    data: CreateEvaluationPeriodDto | UpdateEvaluationPeriodDto,
  ): void {
    if (data.name !== undefined) {
      this.이름형식검증한다(data.name);
    }

    if (data.description !== undefined && data.description.length > 1000) {
      throw new InvalidEvaluationPeriodDataFormatException(
        'description',
        '1000자 이하',
        data.description,
      );
    }
  }

  /**
   * 이름 형식을 검증한다
   */
  private 이름형식검증한다(name: string): void {
    if (!name?.trim()) {
      throw new InvalidEvaluationPeriodDataFormatException(
        'name',
        '공백이 아닌 문자열',
        name,
      );
    }

    if (name.length > 255) {
      throw new InvalidEvaluationPeriodDataFormatException(
        'name',
        '255자 이하',
        name,
      );
    }

    // 특수문자 제한 (기본적인 문자, 숫자, 공백, 하이픈, 언더스코어만 허용)
    const validNamePattern = /^[가-힣a-zA-Z0-9\s\-_()]+$/;
    if (!validNamePattern.test(name)) {
      throw new InvalidEvaluationPeriodDataFormatException(
        'name',
        '한글, 영문, 숫자, 공백, 하이픈, 언더스코어, 괄호만 허용',
        name,
      );
    }
  }

  /**
   * 날짜 범위를 검증한다
   */
  private 날짜범위검증한다(startDate: Date, endDate?: Date): void {
    // endDate가 없으면 검증하지 않음
    if (!endDate) {
      return;
    }

    if (startDate >= endDate) {
      throw new InvalidEvaluationPeriodDateRangeException(
        '시작일은 종료일보다 이전이어야 합니다.',
      );
    }

    // 평가 기간이 너무 짧은지 확인 (최소 7일)
    const diffInDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffInDays < 7) {
      throw new InvalidEvaluationPeriodDateRangeException(
        '평가 기간은 최소 7일 이상이어야 합니다.',
      );
    }

    // 평가 기간이 너무 긴지 확인 (최대 1년)
    if (diffInDays > 365) {
      throw new InvalidEvaluationPeriodDateRangeException(
        '평가 기간은 최대 1년을 초과할 수 없습니다.',
      );
    }
  }

  /**
   * 세부 일정을 검증한다
   */
  private 세부일정검증한다(createDto: CreateEvaluationPeriodDto): void {
    // 평가설정 단계 마감일 검증
    if (createDto.evaluationSetupDeadline) {
      if (createDto.evaluationSetupDeadline <= createDto.startDate) {
        throw new InvalidEvaluationPeriodDateRangeException(
          '평가설정 단계 마감일은 평가 기간 시작일 이후여야 합니다.',
        );
      }
    }

    // 업무 수행 단계 마감일 검증
    if (createDto.performanceDeadline) {
      if (createDto.performanceDeadline <= createDto.startDate) {
        throw new InvalidEvaluationPeriodDateRangeException(
          '업무 수행 단계 마감일은 평가 기간 시작일 이후여야 합니다.',
        );
      }
    }

    // 자기 평가 단계 마감일 검증
    if (createDto.selfEvaluationDeadline) {
      if (createDto.selfEvaluationDeadline <= createDto.startDate) {
        throw new InvalidEvaluationPeriodDateRangeException(
          '자기 평가 단계 마감일은 평가 기간 시작일 이후여야 합니다.',
        );
      }
    }

    // 하향/동료평가 단계 마감일 검증
    if (createDto.peerEvaluationDeadline) {
      if (createDto.peerEvaluationDeadline <= createDto.startDate) {
        throw new InvalidEvaluationPeriodDateRangeException(
          '하향/동료평가 단계 마감일은 평가 기간 시작일 이후여야 합니다.',
        );
      }
    }

    // 단계별 날짜 순서 검증
    this.단계별날짜순서검증한다(
      createDto.startDate,
      createDto.evaluationSetupDeadline,
      createDto.performanceDeadline,
      createDto.selfEvaluationDeadline,
      createDto.peerEvaluationDeadline,
    );
  }

  /**
   * 세부 일정 업데이트를 검증한다
   */
  private 세부일정업데이트검증한다(
    updateDto: UpdateEvaluationPeriodDto,
    existingPeriod: any,
  ): void {
    const newStartDate = updateDto.startDate || existingPeriod.startDate;

    // 평가설정 단계 마감일 검증
    if (updateDto.evaluationSetupDeadline) {
      if (updateDto.evaluationSetupDeadline <= newStartDate) {
        throw new InvalidEvaluationPeriodDateRangeException(
          '평가설정 단계 마감일은 평가 기간 시작일 이후여야 합니다.',
        );
      }
    }

    // 업무 수행 단계 마감일 검증
    if (updateDto.performanceDeadline) {
      if (updateDto.performanceDeadline <= newStartDate) {
        throw new InvalidEvaluationPeriodDateRangeException(
          '업무 수행 단계 마감일은 평가 기간 시작일 이후여야 합니다.',
        );
      }
    }

    // 자기 평가 단계 마감일 검증
    if (updateDto.selfEvaluationDeadline) {
      if (updateDto.selfEvaluationDeadline <= newStartDate) {
        throw new InvalidEvaluationPeriodDateRangeException(
          '자기 평가 단계 마감일은 평가 기간 시작일 이후여야 합니다.',
        );
      }
    }

    // 하향/동료평가 단계 마감일 검증
    if (updateDto.peerEvaluationDeadline) {
      if (updateDto.peerEvaluationDeadline < newStartDate) {
        throw new InvalidEvaluationPeriodDateRangeException(
          '하향/동료평가 단계 마감일은 평가 기간 시작일 이후여야 합니다.',
        );
      }
    }

    // 단계별 날짜 순서 검증 (업데이트된 값과 기존 값을 조합)
    const newEvaluationSetupDeadline =
      updateDto.evaluationSetupDeadline ||
      existingPeriod.evaluationSetupDeadline;
    const newPerformanceDeadline =
      updateDto.performanceDeadline || existingPeriod.performanceDeadline;
    const newSelfEvaluationDeadline =
      updateDto.selfEvaluationDeadline || existingPeriod.selfEvaluationDeadline;
    const newPeerEvaluationDeadline =
      updateDto.peerEvaluationDeadline || existingPeriod.peerEvaluationDeadline;

    // 개별 마감일 수정 시에는 마감일들 간의 논리적 순서만 검증
    this.마감일논리적순서검증한다(
      newEvaluationSetupDeadline,
      newPerformanceDeadline,
      newSelfEvaluationDeadline,
      newPeerEvaluationDeadline,
    );
  }

  /**
   * 단계별 날짜 순서를 검증한다
   * 순서: startDate < evaluationSetupDeadline < performanceDeadline < selfEvaluationDeadline < peerEvaluationDeadline
   */
  private 단계별날짜순서검증한다(
    startDate: Date,
    evaluationSetupDeadline?: Date,
    performanceDeadline?: Date,
    selfEvaluationDeadline?: Date,
    peerEvaluationDeadline?: Date,
  ): void {
    // 설정된 날짜들을 순서대로 배열에 저장
    const dateSteps: { date: Date; name: string }[] = [];

    // 시작일은 항상 포함
    dateSteps.push({ date: startDate, name: '평가 기간 시작일' });

    // 설정된 마감일들을 순서대로 추가
    if (evaluationSetupDeadline) {
      dateSteps.push({
        date: evaluationSetupDeadline,
        name: '평가설정 단계 마감일',
      });
    }
    if (performanceDeadline) {
      dateSteps.push({
        date: performanceDeadline,
        name: '업무 수행 단계 마감일',
      });
    }
    if (selfEvaluationDeadline) {
      dateSteps.push({
        date: selfEvaluationDeadline,
        name: '자기 평가 단계 마감일',
      });
    }
    if (peerEvaluationDeadline) {
      dateSteps.push({
        date: peerEvaluationDeadline,
        name: '하향/동료평가 단계 마감일',
      });
    }

    // 순서 검증: 각 단계가 이전 단계보다 늦어야 함
    for (let i = 1; i < dateSteps.length; i++) {
      const prevStep = dateSteps[i - 1];
      const currentStep = dateSteps[i];

      // 모든 단계는 이전 단계보다 늦어야 함
      if (currentStep.date <= prevStep.date) {
        throw new InvalidEvaluationPeriodDateRangeException(
          `${currentStep.name}은 ${prevStep.name}보다 늦어야 합니다.`,
        );
      }
    }

    // 특별 검증: 설정된 마감일들 간의 논리적 순서 확인
    this.마감일논리적순서검증한다(
      evaluationSetupDeadline,
      performanceDeadline,
      selfEvaluationDeadline,
      peerEvaluationDeadline,
    );
  }

  /**
   * 마감일들의 논리적 순서를 검증한다
   * 평가 프로세스의 흐름에 따라 각 단계는 순서대로 진행되어야 함
   */
  private 마감일논리적순서검증한다(
    evaluationSetupDeadline?: Date,
    performanceDeadline?: Date,
    selfEvaluationDeadline?: Date,
    peerEvaluationDeadline?: Date,
  ): void {
    // 평가설정 → 업무수행 순서 검증
    if (evaluationSetupDeadline && performanceDeadline) {
      if (performanceDeadline <= evaluationSetupDeadline) {
        throw new InvalidEvaluationPeriodDateRangeException(
          '업무 수행 단계 마감일은 평가설정 단계 마감일보다 늦어야 합니다.',
        );
      }
    }

    // 업무수행 → 자기평가 순서 검증
    if (performanceDeadline && selfEvaluationDeadline) {
      if (selfEvaluationDeadline <= performanceDeadline) {
        throw new InvalidEvaluationPeriodDateRangeException(
          '자기 평가 단계 마감일은 업무 수행 단계 마감일보다 늦어야 합니다.',
        );
      }
    }

    // 자기평가 → 하향/동료평가 순서 검증
    if (selfEvaluationDeadline && peerEvaluationDeadline) {
      if (peerEvaluationDeadline <= selfEvaluationDeadline) {
        throw new InvalidEvaluationPeriodDateRangeException(
          '하향/동료평가 단계 마감일은 자기 평가 단계 마감일보다 늦어야 합니다.',
        );
      }
    }

    // 건너뛰는 단계가 있는 경우의 검증
    // 예: 평가설정 → 자기평가 (업무수행 생략)
    if (
      evaluationSetupDeadline &&
      selfEvaluationDeadline &&
      !performanceDeadline
    ) {
      if (selfEvaluationDeadline <= evaluationSetupDeadline) {
        throw new InvalidEvaluationPeriodDateRangeException(
          '자기 평가 단계 마감일은 평가설정 단계 마감일보다 늦어야 합니다.',
        );
      }
    }

    // 예: 평가설정 → 하향/동료평가 (중간 단계 생략)
    if (
      evaluationSetupDeadline &&
      peerEvaluationDeadline &&
      !performanceDeadline &&
      !selfEvaluationDeadline
    ) {
      if (peerEvaluationDeadline <= evaluationSetupDeadline) {
        throw new InvalidEvaluationPeriodDateRangeException(
          '하향/동료평가 단계 마감일은 평가설정 단계 마감일보다 늦어야 합니다.',
        );
      }
    }

    // 예: 업무수행 → 하향/동료평가 (자기평가 생략)
    if (
      performanceDeadline &&
      peerEvaluationDeadline &&
      !selfEvaluationDeadline
    ) {
      if (peerEvaluationDeadline <= performanceDeadline) {
        throw new InvalidEvaluationPeriodDateRangeException(
          '하향/동료평가 단계 마감일은 업무 수행 단계 마감일보다 늦어야 합니다.',
        );
      }
    }
  }

  /**
   * 자기평가 달성률을 검증한다
   */
  private 자기평가달성률검증한다(rate: number): void {
    if (!Number.isInteger(rate)) {
      throw new InvalidSelfEvaluationRateException(rate, 0, 200);
    }

    if (rate < 0 || rate > 200) {
      throw new InvalidSelfEvaluationRateException(rate, 0, 200);
    }
  }

  /**
   * 생성 시 비즈니스 규칙을 검증한다
   */
  private async 생성비즈니스규칙검증한다(
    createDto: CreateEvaluationPeriodDto,
    manager?: EntityManager,
  ): Promise<void> {
    // 도메인 비즈니스 규칙 검증 (Domain Service 레벨)
    await this.이름중복검증한다(createDto.name, undefined, manager);
    await this.기간겹침검증한다(
      createDto.startDate,
      createDto.peerEvaluationDeadline,
      undefined,
      manager,
    );
  }

  /**
   * 업데이트 시 비즈니스 규칙을 검증한다
   */
  private async 업데이트비즈니스규칙검증한다(
    id: string,
    updateDto: UpdateEvaluationPeriodDto,
    existingPeriod: any,
    manager?: EntityManager,
  ): Promise<void> {
    // 완료된 평가 기간의 주요 정보는 수정할 수 없음
    if (existingPeriod.status === EvaluationPeriodStatus.COMPLETED) {
      if (updateDto.startDate || updateDto.name) {
        throw new EvaluationPeriodBusinessRuleViolationException(
          '완료된 평가 기간의 기본 정보는 수정할 수 없습니다.',
        );
      }
    }

    // 활성 상태인 평가 기간의 날짜는 제한적으로만 수정 가능
    if (existingPeriod.활성화된_상태인가() && updateDto.startDate) {
      const now = new Date();

      // 시작일이 이미 지난 경우 시작일 수정 불가
      if (updateDto.startDate && existingPeriod.startDate <= now) {
        throw new EvaluationPeriodBusinessRuleViolationException(
          '이미 시작된 평가 기간의 시작일은 수정할 수 없습니다.',
        );
      }
    }
  }



  /**
   * 평가 기간 업데이트 비즈니스 규칙을 검증한다
   */
  async 평가기간업데이트비즈니스규칙검증한다(
    id: string,
    updateDto: UpdateEvaluationPeriodDto,
    manager?: EntityManager,
  ): Promise<void> {
    // 기존 평가 기간 조회
    const repository = this.transactionManager.getRepository(
      EvaluationPeriod,
      this.evaluationPeriodRepository,
      manager,
    );
    const existingPeriod = await repository.findOne({ where: { id } });
    if (!existingPeriod) {
      throw new EvaluationPeriodRequiredDataMissingException(
        '존재하지 않는 평가 기간입니다.',
      );
    }

    // 완료된 평가 기간 수정 제한 검증
    if (existingPeriod.status === EvaluationPeriodStatus.COMPLETED) {
      throw new EvaluationPeriodBusinessRuleViolationException(
        '완료된 평가 기간은 수정할 수 없습니다.',
      );
    }

    // 이름 중복 확인 (변경하는 경우)
    if (updateDto.name && updateDto.name !== existingPeriod.name) {
      await this.이름중복검증한다(updateDto.name, id, manager);
    }

    // 기간 겹침 확인 (시작일을 변경하는 경우)
    if (updateDto.startDate) {
      const newStartDate = updateDto.startDate;
      const existingPeerEvaluationDeadline =
        existingPeriod.peerEvaluationDeadline;

      // 시작일은 동료평가 마감일보다 이전이어야 함
      if (existingPeerEvaluationDeadline) {
        const startDateObj =
          newStartDate instanceof Date ? newStartDate : new Date(newStartDate);
        const peerEvaluationDeadlineObj =
          existingPeerEvaluationDeadline instanceof Date
            ? existingPeerEvaluationDeadline
            : new Date(existingPeerEvaluationDeadline);
        this.날짜범위검증한다(startDateObj, peerEvaluationDeadlineObj);
      }

      await this.기간겹침검증한다(
        newStartDate,
        existingPeerEvaluationDeadline || new Date(),
        id,
        manager,
      );
    }

    // 세부 일정 검증 (마감일 관련)
    this.세부일정업데이트검증한다(updateDto, existingPeriod);

    // 기존 업데이트 비즈니스 규칙 검증
    await this.업데이트비즈니스규칙검증한다(
      id,
      updateDto,
      existingPeriod,
      manager,
    );
  }

  /**
   * 평가 기간 시작 비즈니스 규칙을 검증한다
   */
  async 평가기간시작비즈니스규칙검증한다(
    id: string,
    manager?: EntityManager,
  ): Promise<void> {
    // 이미 활성 평가 기간이 있는지 확인
    const activePeriod = await this.현재진행중평가기간조회한다(manager);
    if (activePeriod && activePeriod.id !== id) {
      throw new EvaluationPeriodBusinessRuleViolationException(
        `이미 활성화된 평가 기간이 있습니다: ${activePeriod.name}`,
      );
    }
  }

  /**
   * 평가 기간 삭제 비즈니스 규칙을 검증한다
   */
  async 평가기간삭제비즈니스규칙검증한다(evaluationPeriod: any): Promise<void> {
    // 활성 상태인 평가 기간은 삭제할 수 없음
    if (evaluationPeriod.활성화된_상태인가()) {
      throw new EvaluationPeriodBusinessRuleViolationException(
        '활성 상태인 평가 기간은 삭제할 수 없습니다.',
      );
    }
  }

  /**
   * 수동 허용 설정 변경 비즈니스 규칙을 검증한다
   */
  async 수동허용설정변경비즈니스규칙검증한다(
    evaluationPeriod: any,
  ): Promise<void> {
    // 완료된 평가 기간은 수정할 수 없음
    if (evaluationPeriod.완료된_상태인가()) {
      throw new EvaluationPeriodBusinessRuleViolationException(
        '완료된 평가 기간은 수정할 수 없습니다.',
      );
    }
  }

  /**
   * 이름 중복을 검증한다
   */
  private async 이름중복검증한다(
    name: string,
    excludeId?: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repository = this.transactionManager.getRepository(
      EvaluationPeriod,
      this.evaluationPeriodRepository,
      manager,
    );

    const queryBuilder = repository
      .createQueryBuilder('period')
      .where('period.name = :name', { name });

    if (excludeId) {
      queryBuilder.andWhere('period.id != :excludeId', { excludeId });
    }

    const count = await queryBuilder.getCount();
    if (count > 0) {
      throw new EvaluationPeriodNameDuplicateException(name);
    }
  }

  /**
   * 기간 겹침을 검증한다
   * peerEvaluationDeadline을 기준으로 검증합니다.
   */
  private async 기간겹침검증한다(
    startDate: Date,
    peerEvaluationDeadline?: Date,
    excludeId?: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repository = this.transactionManager.getRepository(
      EvaluationPeriod,
      this.evaluationPeriodRepository,
      manager,
    );

    const queryBuilder = repository
      .createQueryBuilder('period')
      .where(
        '(period.startDate <= :peerEvaluationDeadline AND period.peerEvaluationDeadline >= :startDate)',
        { startDate, peerEvaluationDeadline },
      );

    if (excludeId) {
      queryBuilder.andWhere('period.id != :excludeId', { excludeId });
    }

    const conflictingPeriod = await queryBuilder.getOne();
    if (conflictingPeriod) {
      throw new EvaluationPeriodOverlapException(
        startDate,
        peerEvaluationDeadline || new Date(),
        conflictingPeriod.id,
      );
    }
  }

  /**
   * 현재 진행중인 평가 기간을 조회한다
   */
  private async 현재진행중평가기간조회한다(
    manager?: EntityManager,
  ): Promise<any | null> {
    const repository = this.transactionManager.getRepository(
      EvaluationPeriod,
      this.evaluationPeriodRepository,
      manager,
    );

    const now = new Date();
    const evaluationPeriod = await repository.findOne({
      where: {
        status: EvaluationPeriodStatus.IN_PROGRESS,
        startDate: LessThanOrEqual(now),
      },
      order: { startDate: 'DESC' },
    });

    return evaluationPeriod || null;
  }
}
