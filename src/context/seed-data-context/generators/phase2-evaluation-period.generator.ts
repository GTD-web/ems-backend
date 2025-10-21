import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import {
  SeedDataConfig,
  GeneratorResult,
  DEFAULT_STATE_DISTRIBUTION,
} from '../types';
import { ProbabilityUtil, DateGeneratorUtil } from '../utils';
import {
  EvaluationPeriodStatus,
  EvaluationPeriodPhase,
} from '@domain/core/evaluation-period/evaluation-period.types';

const BATCH_SIZE = 500;
const CREATED_BY = 'seed-generator';

@Injectable()
export class Phase2EvaluationPeriodGenerator {
  private readonly logger = new Logger(Phase2EvaluationPeriodGenerator.name);

  constructor(
    @InjectRepository(EvaluationPeriod)
    private readonly periodRepository: Repository<EvaluationPeriod>,
    @InjectRepository(EvaluationPeriodEmployeeMapping)
    private readonly mappingRepository: Repository<EvaluationPeriodEmployeeMapping>,
  ) {}

  async generate(
    config: SeedDataConfig,
    phase1Result: GeneratorResult,
  ): Promise<GeneratorResult> {
    const startTime = Date.now();
    const dist = {
      ...DEFAULT_STATE_DISTRIBUTION,
      ...config.stateDistribution,
    };

    this.logger.log('Phase 2 시작: 평가기간 데이터 생성');

    const employeeIds = phase1Result.generatedIds.employeeIds;

    // 1. EvaluationPeriod 생성
    const periodCount = config.evaluationConfig?.periodCount || 1;
    const periodIds = await this.생성_평가기간들(periodCount, dist);
    this.logger.log(`생성 완료: EvaluationPeriod ${periodIds.length}개`);

    // 2. EvaluationPeriodEmployeeMapping 생성
    const mappingIds = await this.생성_평가대상자_매핑들(
      periodIds,
      employeeIds,
      dist,
    );
    this.logger.log(
      `생성 완료: EvaluationPeriodEmployeeMapping ${mappingIds.length}개`,
    );

    const duration = Date.now() - startTime;
    this.logger.log(`Phase 2 완료 (${duration}ms)`);

    return {
      phase: 'Phase2',
      entityCounts: {
        EvaluationPeriod: periodIds.length,
        EvaluationPeriodEmployeeMapping: mappingIds.length,
      },
      generatedIds: {
        periodIds,
        mappingIds,
      },
      duration,
    };
  }

  private async 생성_평가기간들(
    count: number,
    dist: typeof DEFAULT_STATE_DISTRIBUTION,
  ): Promise<string[]> {
    const periods: EvaluationPeriod[] = [];
    const baseDate = new Date();
    const uniqueSuffix = Date.now().toString(36).slice(-4); // 타임스탬프 기반 4자리 고유 식별자

    for (let i = 0; i < count; i++) {
      const period = new EvaluationPeriod();
      const year = baseDate.getFullYear() - i;
      const halfYear = i % 2 === 0 ? '상반기' : '하반기';

      // 동시성 이슈 방지: 타임스탬프 기반 고유 식별자 추가
      period.name = `${year}년 ${halfYear} 평가-${uniqueSuffix}`;

      // 날짜 생성
      const { startDate, endDate } = DateGeneratorUtil.generateDateRange(
        DateGeneratorUtil.addMonths(baseDate, -i * 6),
        dist.dateGeneration.evaluationPeriod.durationMonths.min,
        dist.dateGeneration.evaluationPeriod.durationMonths.max,
        'months',
      );
      period.startDate = startDate;
      period.endDate = endDate;
      period.description = faker.lorem.sentence();

      // 상태 결정
      const statusKey = ProbabilityUtil.selectByProbability(
        dist.evaluationPeriodStatus,
      );
      period.status =
        statusKey === 'waiting'
          ? EvaluationPeriodStatus.WAITING
          : statusKey === 'inProgress'
            ? EvaluationPeriodStatus.IN_PROGRESS
            : EvaluationPeriodStatus.COMPLETED;

      // 현재 단계 결정 (inProgress일 때만)
      if (period.status === EvaluationPeriodStatus.IN_PROGRESS) {
        const phaseKey = ProbabilityUtil.selectByProbability(
          dist.evaluationPeriodPhase,
        );
        period.currentPhase = this.맵_단계_키_to_Enum(phaseKey as string);

        // 단계별 마감일 설정
        this.설정_단계별_마감일(period, dist);
      } else if (period.status === EvaluationPeriodStatus.WAITING) {
        period.currentPhase = EvaluationPeriodPhase.WAITING;
      } else {
        period.currentPhase = EvaluationPeriodPhase.CLOSURE;
        period.completedDate = new Date();
      }

      // 수동 허용 설정 (20% 확률)
      period.criteriaSettingEnabled = Math.random() < 0.2;
      period.selfEvaluationSettingEnabled = Math.random() < 0.2;
      period.finalEvaluationSettingEnabled = Math.random() < 0.2;

      // 자기평가 달성률 최대값
      period.maxSelfEvaluationRate = [100, 110, 120, 150][
        Math.floor(Math.random() * 4)
      ];

      // 등급 구간 설정 (기본값)
      period.gradeRanges = this.생성_기본_등급구간();

      period.createdBy = CREATED_BY;
      periods.push(period);
    }

    const saved = await this.평가기간을_배치로_저장한다(periods);
    return saved.map((p) => p.id);
  }

  /**
   * 기본 등급 구간을 생성한다
   * S: 95-100, A: 90-94, B: 80-89, C: 70-79, D: 60-69
   */
  private 생성_기본_등급구간() {
    return [
      { grade: 'S', minRange: 95, maxRange: 100 },
      { grade: 'A', minRange: 90, maxRange: 94 },
      { grade: 'B', minRange: 80, maxRange: 89 },
      { grade: 'C', minRange: 70, maxRange: 79 },
      { grade: 'D', minRange: 60, maxRange: 69 },
    ];
  }

  private 맵_단계_키_to_Enum(key: string): EvaluationPeriodPhase {
    const map: Record<string, EvaluationPeriodPhase> = {
      evaluationSetup: EvaluationPeriodPhase.EVALUATION_SETUP,
      performance: EvaluationPeriodPhase.PERFORMANCE,
      selfEvaluation: EvaluationPeriodPhase.SELF_EVALUATION,
      peerEvaluation: EvaluationPeriodPhase.PEER_EVALUATION,
      closure: EvaluationPeriodPhase.CLOSURE,
    };
    return map[key] || EvaluationPeriodPhase.EVALUATION_SETUP;
  }

  private 설정_단계별_마감일(
    period: EvaluationPeriod,
    dist: typeof DEFAULT_STATE_DISTRIBUTION,
  ): void {
    const gapDays = dist.dateGeneration.evaluationPeriod.phaseGapDays;
    let currentDate = new Date(period.startDate);

    period.evaluationSetupDeadline = DateGeneratorUtil.addDays(
      currentDate,
      gapDays * 2,
    );
    currentDate = period.evaluationSetupDeadline;

    period.performanceDeadline = DateGeneratorUtil.addDays(
      currentDate,
      gapDays * 8,
    );
    currentDate = period.performanceDeadline;

    period.selfEvaluationDeadline = DateGeneratorUtil.addDays(
      currentDate,
      gapDays * 2,
    );
    currentDate = period.selfEvaluationDeadline;

    period.peerEvaluationDeadline = DateGeneratorUtil.addDays(
      currentDate,
      gapDays * 2,
    );
  }

  private async 생성_평가대상자_매핑들(
    periodIds: string[],
    employeeIds: string[],
    dist: typeof DEFAULT_STATE_DISTRIBUTION,
  ): Promise<string[]> {
    const allMappings: EvaluationPeriodEmployeeMapping[] = [];

    for (const periodId of periodIds) {
      const mappings: EvaluationPeriodEmployeeMapping[] = [];

      for (const employeeId of employeeIds) {
        const mapping = new EvaluationPeriodEmployeeMapping();
        mapping.evaluationPeriodId = periodId;
        mapping.employeeId = employeeId;

        // 제외 여부 결정
        mapping.isExcluded = ProbabilityUtil.rollDice(
          dist.excludedFromEvaluation,
        );

        if (mapping.isExcluded) {
          mapping.excludeReason = faker.lorem.sentence();
          mapping.excludedBy = CREATED_BY;
          mapping.excludedAt = new Date();
        }

        // 수정 가능 여부 (기본은 true)
        mapping.isSelfEvaluationEditable = true;
        mapping.isPrimaryEvaluationEditable = true;
        mapping.isSecondaryEvaluationEditable = true;

        mapping.createdBy = CREATED_BY;
        mappings.push(mapping);
      }

      const saved = await this.매핑을_배치로_저장한다(mappings);
      allMappings.push(...saved);
    }

    return allMappings.map((m) => m.id);
  }

  private async 평가기간을_배치로_저장한다(
    periods: EvaluationPeriod[],
  ): Promise<EvaluationPeriod[]> {
    const saved: EvaluationPeriod[] = [];
    for (let i = 0; i < periods.length; i += BATCH_SIZE) {
      const batch = periods.slice(i, i + BATCH_SIZE);
      const result = await this.periodRepository.save(batch);
      saved.push(...result);
      this.logger.log(
        `평가기간 저장 진행: ${Math.min(i + BATCH_SIZE, periods.length)}/${periods.length}`,
      );
    }
    return saved;
  }

  private async 매핑을_배치로_저장한다(
    mappings: EvaluationPeriodEmployeeMapping[],
  ): Promise<EvaluationPeriodEmployeeMapping[]> {
    const saved: EvaluationPeriodEmployeeMapping[] = [];
    for (let i = 0; i < mappings.length; i += BATCH_SIZE) {
      const batch = mappings.slice(i, i + BATCH_SIZE);
      const result = await this.mappingRepository.save(batch);
      saved.push(...result);
      this.logger.log(
        `매핑 저장 진행: ${Math.min(i + BATCH_SIZE, mappings.length)}/${mappings.length}`,
      );
    }
    return saved;
  }
}
