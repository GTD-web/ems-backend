import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';

import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { DownwardEvaluationType } from '@domain/core/downward-evaluation/downward-evaluation.types';
import { PeerEvaluation } from '@domain/core/peer-evaluation/peer-evaluation.entity';
import { PeerEvaluationStatus } from '@domain/core/peer-evaluation/peer-evaluation.types';
import { FinalEvaluation } from '@domain/core/final-evaluation/final-evaluation.entity';
import {
  JobGrade,
  JobDetailedGrade,
} from '@domain/core/final-evaluation/final-evaluation.types';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluatorType } from '@domain/core/evaluation-line/evaluation-line.types';

import {
  SeedDataConfig,
  GeneratorResult,
  DEFAULT_STATE_DISTRIBUTION,
} from '../types';
import { ProbabilityUtil, ScoreGeneratorUtil } from '../utils';

const BATCH_SIZE = 500;

@Injectable()
export class Phase7EvaluationGenerator {
  private readonly logger = new Logger(Phase7EvaluationGenerator.name);

  constructor(
    @InjectRepository(WbsSelfEvaluation)
    private readonly wbsSelfEvaluationRepository: Repository<WbsSelfEvaluation>,
    @InjectRepository(DownwardEvaluation)
    private readonly downwardEvaluationRepository: Repository<DownwardEvaluation>,
    @InjectRepository(PeerEvaluation)
    private readonly peerEvaluationRepository: Repository<PeerEvaluation>,
    @InjectRepository(FinalEvaluation)
    private readonly finalEvaluationRepository: Repository<FinalEvaluation>,
    @InjectRepository(EvaluationPeriod)
    private readonly evaluationPeriodRepository: Repository<EvaluationPeriod>,
    @InjectRepository(EvaluationWbsAssignment)
    private readonly wbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
    @InjectRepository(EvaluationLineMapping)
    private readonly evaluationLineMappingRepository: Repository<EvaluationLineMapping>,
    @InjectRepository(EvaluationLine)
    private readonly evaluationLineRepository: Repository<EvaluationLine>,
  ) {}

  async generate(
    config: SeedDataConfig,
    phase1Result: GeneratorResult,
    phase2Result: GeneratorResult,
  ): Promise<GeneratorResult> {
    const startTime = Date.now();
    const dist = {
      ...DEFAULT_STATE_DISTRIBUTION,
      ...config.stateDistribution,
    };

    this.logger.log('Phase 7: 평가 실행 생성');

    const systemAdminId = phase1Result.generatedIds.systemAdminId as string;
    const employeeIds = phase1Result.generatedIds.employeeIds as string[];
    const periodIds = phase2Result.generatedIds.periodIds as string[];

    // 평가기간별 maxSelfEvaluationRate 조회 (점수 범위 결정을 위해)
    const periodMaxRates = await this.평가기간_최대달성률을_조회한다(periodIds);

    // 1. WbsSelfEvaluation 생성 (간소화)
    const selfEvaluations = await this.생성_자기평가들(
      employeeIds,
      periodIds,
      periodMaxRates,
      dist,
      systemAdminId,
    );
    this.logger.log(`생성 완료: WbsSelfEvaluation ${selfEvaluations.length}개`);

    // 2. DownwardEvaluation 생성 (간소화)
    const downwardEvaluations = await this.생성_하향평가들(
      employeeIds,
      periodIds,
      periodMaxRates,
      dist,
      systemAdminId,
    );
    this.logger.log(
      `생성 완료: DownwardEvaluation ${downwardEvaluations.length}개`,
    );

    // 3. PeerEvaluation 생성 (간소화)
    const peerEvaluations = await this.생성_동료평가들(
      employeeIds,
      periodIds,
      dist,
      systemAdminId,
    );
    this.logger.log(`생성 완료: PeerEvaluation ${peerEvaluations.length}개`);

    // 4. FinalEvaluation 생성 (간소화)
    const finalEvaluations = await this.생성_최종평가들(
      employeeIds,
      periodIds,
      dist,
      systemAdminId,
    );
    this.logger.log(`생성 완료: FinalEvaluation ${finalEvaluations.length}개`);

    const duration = Date.now() - startTime;
    this.logger.log(`Phase 7 완료 (${duration}ms)`);

    return {
      phase: 'Phase7',
      entityCounts: {
        WbsSelfEvaluation: selfEvaluations.length,
        DownwardEvaluation: downwardEvaluations.length,
        PeerEvaluation: peerEvaluations.length,
        FinalEvaluation: finalEvaluations.length,
      },
      generatedIds: {
        selfEvaluationIds: selfEvaluations.map((se) => se.id),
        downwardEvaluationIds: downwardEvaluations.map((de) => de.id),
        peerEvaluationIds: peerEvaluations.map((pe) => pe.id),
        finalEvaluationIds: finalEvaluations.map((fe) => fe.id),
      },
      duration,
    };
  }

  private async 생성_자기평가들(
    employeeIds: string[],
    periodIds: string[],
    periodMaxRates: Map<string, number>,
    dist: typeof DEFAULT_STATE_DISTRIBUTION,
    systemAdminId: string,
  ): Promise<WbsSelfEvaluation[]> {
    const evaluations: WbsSelfEvaluation[] = [];
    const periodId = periodIds[0];
    const maxRate = periodMaxRates.get(periodId) || 120; // 기본값 120

    // 실제 WBS 할당 데이터를 조회해서 자기평가 생성
    const wbsAssignments = await this.wbsAssignmentRepository
      .createQueryBuilder('assignment')
      .select([
        'assignment.id',
        'assignment.employeeId',
        'assignment.periodId',
        'assignment.wbsItemId',
        'assignment.assignedBy',
        'assignment.assignedDate',
      ])
      .where('assignment.periodId = :periodId', { periodId })
      .andWhere('assignment.deletedAt IS NULL')
      .getMany();

    this.logger.log(`조회된 WBS 할당: ${wbsAssignments.length}개`);

    // 각 WBS 할당에 대해 자기평가 생성
    for (const assignment of wbsAssignments) {
      // stateDistribution 설정에 따라 완료 상태 결정
      const statusChoice = ProbabilityUtil.selectByProbability(
        dist.selfEvaluationProgress,
      );
      const isCompleted = statusChoice === 'completed';

      const evaluation = new WbsSelfEvaluation();
      evaluation.employeeId = assignment.employeeId;
      evaluation.periodId = assignment.periodId;
      evaluation.wbsItemId = assignment.wbsItemId;
      evaluation.assignedBy = assignment.assignedBy || systemAdminId;
      evaluation.assignedDate = assignment.assignedDate || new Date();
      evaluation.evaluationDate = new Date();
      evaluation.isCompleted = isCompleted;

      if (isCompleted) {
        evaluation.completedAt = new Date();

        // 완료된 경우에만 점수 생성
        // 평가기간의 maxSelfEvaluationRate를 최대값으로 사용
        // 최소값은 1, 평균은 maxRate의 70%, 표준편차는 maxRate의 10%
        const mean = Math.round(maxRate * 0.7);
        const stdDev = Math.round(maxRate * 0.1);
        evaluation.selfEvaluationScore = ScoreGeneratorUtil.generateNormalScore(
          1,
          maxRate,
          mean,
          stdDev,
        );
        evaluation.selfEvaluationContent = faker.lorem.paragraph();
        evaluation.performanceResult = faker.lorem.paragraph();
      }

      evaluation.createdBy = systemAdminId;
      evaluations.push(evaluation);
    }

    this.logger.log(
      `자기평가 생성 - 총 ${evaluations.length}개 (완료: ${evaluations.filter((e) => e.isCompleted).length}개)`,
    );
    this.logger.log(
      `자기평가 점수 범위: 1-${maxRate} (평균: ${Math.round(maxRate * 0.7)})`,
    );

    return await this.배치로_저장한다(
      this.wbsSelfEvaluationRepository,
      evaluations,
      '자기평가',
    );
  }

  private async 생성_하향평가들(
    employeeIds: string[],
    periodIds: string[],
    periodMaxRates: Map<string, number>,
    dist: typeof DEFAULT_STATE_DISTRIBUTION,
    systemAdminId: string,
  ): Promise<DownwardEvaluation[]> {
    const evaluations: DownwardEvaluation[] = [];
    const periodId = periodIds[0];

    // 실제 WBS 할당 데이터를 조회
    const wbsAssignments = await this.wbsAssignmentRepository
      .createQueryBuilder('assignment')
      .select([
        'assignment.id',
        'assignment.employeeId',
        'assignment.periodId',
        'assignment.wbsItemId',
      ])
      .where('assignment.periodId = :periodId', { periodId })
      .andWhere('assignment.deletedAt IS NULL')
      .getMany();

    this.logger.log(`조회된 WBS 할당: ${wbsAssignments.length}개`);

    // 평가라인 조회 (PRIMARY, SECONDARY)
    const evaluationLines = await this.evaluationLineRepository
      .createQueryBuilder('line')
      .where('line.deletedAt IS NULL')
      .andWhere('line.evaluatorType IN (:...types)', {
        types: [EvaluatorType.PRIMARY, EvaluatorType.SECONDARY],
      })
      .getMany();

    const primaryLine = evaluationLines.find(
      (l) => l.evaluatorType === EvaluatorType.PRIMARY,
    );
    const secondaryLine = evaluationLines.find(
      (l) => l.evaluatorType === EvaluatorType.SECONDARY,
    );

    if (!primaryLine) {
      this.logger.warn('PRIMARY 평가라인이 없습니다.');
      return [];
    }

    // 각 WBS 할당에 대해 하향평가 생성
    for (const assignment of wbsAssignments) {
      // 해당 직원의 평가라인 매핑 조회
      const lineMappings = await this.evaluationLineMappingRepository
        .createQueryBuilder('mapping')
        .where('mapping.employeeId = :employeeId', {
          employeeId: assignment.employeeId,
        })
        .andWhere('mapping.evaluationLineId IN (:...lineIds)', {
          lineIds: [primaryLine.id, secondaryLine?.id].filter(Boolean),
        })
        .andWhere('mapping.deletedAt IS NULL')
        .getMany();

      // PRIMARY 평가자 하향평가 생성
      const primaryMapping = lineMappings.find(
        (m) => m.evaluationLineId === primaryLine.id,
      );
      if (primaryMapping) {
        // 1차 하향평가는 전용 progress 옵션 사용 (있으면)
        const primaryProgress =
          dist.primaryDownwardEvaluationProgress ||
          dist.downwardEvaluationProgress;
        const statusChoice =
          ProbabilityUtil.selectByProbability(primaryProgress);
        const isCompleted = statusChoice === 'completed';

        const evaluation = new DownwardEvaluation();
        evaluation.employeeId = assignment.employeeId;
        evaluation.evaluatorId = primaryMapping.evaluatorId;
        evaluation.periodId = assignment.periodId;
        evaluation.wbsId = assignment.wbsItemId;
        evaluation.evaluationType = DownwardEvaluationType.PRIMARY;
        evaluation.evaluationDate = new Date();
        evaluation.isCompleted = isCompleted;

        if (isCompleted) {
          evaluation.completedAt = new Date();
          // 하향평가는 1-5점 범위 (평균 3점, 표준편차 1점)
          evaluation.downwardEvaluationScore =
            ScoreGeneratorUtil.generateNormalScore(1, 5, 3, 1);
          evaluation.downwardEvaluationContent = faker.lorem.paragraph();
        }

        evaluation.createdBy = primaryMapping.evaluatorId;
        evaluations.push(evaluation);
      }

      // SECONDARY 평가자 하향평가 생성
      if (secondaryLine) {
        const secondaryMapping = lineMappings.find(
          (m) => m.evaluationLineId === secondaryLine.id,
        );
        if (secondaryMapping) {
          // 2차 하향평가는 전용 progress 옵션 사용 (있으면)
          const secondaryProgress =
            dist.secondaryDownwardEvaluationProgress ||
            dist.downwardEvaluationProgress;
          const statusChoice =
            ProbabilityUtil.selectByProbability(secondaryProgress);
          const isCompleted = statusChoice === 'completed';

          const evaluation = new DownwardEvaluation();
          evaluation.employeeId = assignment.employeeId;
          evaluation.evaluatorId = secondaryMapping.evaluatorId;
          evaluation.periodId = assignment.periodId;
          evaluation.wbsId = assignment.wbsItemId;
          evaluation.evaluationType = DownwardEvaluationType.SECONDARY;
          evaluation.evaluationDate = new Date();
          evaluation.isCompleted = isCompleted;

          if (isCompleted) {
            evaluation.completedAt = new Date();
            // 하향평가는 1-5점 범위 (평균 3점, 표준편차 1점)
            evaluation.downwardEvaluationScore =
              ScoreGeneratorUtil.generateNormalScore(1, 5, 3, 1);
            evaluation.downwardEvaluationContent = faker.lorem.paragraph();
          }

          evaluation.createdBy = secondaryMapping.evaluatorId;
          evaluations.push(evaluation);
        }
      }
    }

    this.logger.log(
      `하향평가 생성 - 총 ${evaluations.length}개 (완료: ${evaluations.filter((e) => e.isCompleted).length}개)`,
    );
    this.logger.log(`하향평가 점수 범위: 1-5 (평균: 3)`);

    return await this.배치로_저장한다(
      this.downwardEvaluationRepository,
      evaluations,
      '하향평가',
    );
  }

  private async 생성_동료평가들(
    employeeIds: string[],
    periodIds: string[],
    dist: typeof DEFAULT_STATE_DISTRIBUTION,
    systemAdminId: string,
  ): Promise<PeerEvaluation[]> {
    const evaluations: PeerEvaluation[] = [];
    const periodId = periodIds[0];

    // 간소화: 일부 직원에 대해서만 동료평가 생성
    for (let i = 0; i < Math.min(5, employeeIds.length); i++) {
      const evaluation = new PeerEvaluation();
      evaluation.evaluateeId = employeeIds[i];
      evaluation.evaluatorId = employeeIds[(i + 1) % employeeIds.length];
      evaluation.periodId = periodId;
      evaluation.evaluationDate = new Date();
      evaluation.mappedBy = systemAdminId;
      evaluation.mappedDate = new Date();
      evaluation.isActive = true;

      const statusChoice = ProbabilityUtil.selectByProbability(
        dist.peerEvaluationProgress,
      );
      evaluation.status =
        statusChoice === 'completed'
          ? PeerEvaluationStatus.COMPLETED
          : statusChoice === 'inProgress'
            ? PeerEvaluationStatus.IN_PROGRESS
            : PeerEvaluationStatus.PENDING;

      evaluation.isCompleted = statusChoice === 'completed';
      if (evaluation.isCompleted) {
        evaluation.completedAt = new Date();
      }

      evaluation.createdBy = systemAdminId;
      evaluations.push(evaluation);
    }

    return await this.배치로_저장한다(
      this.peerEvaluationRepository,
      evaluations,
      '동료평가',
    );
  }

  private async 생성_최종평가들(
    employeeIds: string[],
    periodIds: string[],
    dist: typeof DEFAULT_STATE_DISTRIBUTION,
    systemAdminId: string,
  ): Promise<FinalEvaluation[]> {
    const evaluations: FinalEvaluation[] = [];

    const evaluationGrades = ['S', 'A', 'B', 'C', 'D'];
    const jobGrades = [JobGrade.T1, JobGrade.T2, JobGrade.T3];
    const jobDetailedGrades = [
      JobDetailedGrade.U,
      JobDetailedGrade.N,
      JobDetailedGrade.A,
    ];

    // 모든 직원의 모든 평가기간에 대해 최종평가 생성
    for (const employeeId of employeeIds) {
      for (const periodId of periodIds) {
        const evaluation = new FinalEvaluation();
        evaluation.employeeId = employeeId;
        evaluation.periodId = periodId;

        evaluation.evaluationGrade =
          evaluationGrades[Math.floor(Math.random() * evaluationGrades.length)];
        evaluation.jobGrade =
          jobGrades[Math.floor(Math.random() * jobGrades.length)];
        evaluation.jobDetailedGrade =
          jobDetailedGrades[
            Math.floor(Math.random() * jobDetailedGrades.length)
          ];

        const statusChoice = ProbabilityUtil.selectByProbability(
          dist.finalEvaluationProgress,
        );
        evaluation.isConfirmed = statusChoice === 'completed';
        if (evaluation.isConfirmed) {
          evaluation.confirmedAt = new Date();
          evaluation.confirmedBy = systemAdminId;
        }

        evaluation.finalComments = faker.lorem.paragraph();
        evaluation.createdBy = systemAdminId;
        evaluations.push(evaluation);
      }
    }

    return await this.배치로_저장한다(
      this.finalEvaluationRepository,
      evaluations,
      '최종평가',
    );
  }

  // ==================== 유틸리티 메서드 ====================

  /**
   * 평가기간별 최대 달성률을 조회한다
   */
  private async 평가기간_최대달성률을_조회한다(
    periodIds: string[],
  ): Promise<Map<string, number>> {
    const periods = await this.evaluationPeriodRepository.findByIds(periodIds);
    const periodMaxRates = new Map<string, number>();

    for (const period of periods) {
      periodMaxRates.set(period.id, period.maxSelfEvaluationRate);
      this.logger.log(
        `평가기간 ${period.name}: maxSelfEvaluationRate = ${period.maxSelfEvaluationRate}`,
      );
    }

    return periodMaxRates;
  }

  private async 배치로_저장한다<T extends object>(
    repository: Repository<T>,
    entities: T[],
    entityName: string,
  ): Promise<T[]> {
    const saved: T[] = [];
    for (let i = 0; i < entities.length; i += BATCH_SIZE) {
      const batch = entities.slice(i, i + BATCH_SIZE);
      const result = await repository.save(batch as any);
      saved.push(...(result as T[]));
      this.logger.log(
        `${entityName} 저장 진행: ${Math.min(i + BATCH_SIZE, entities.length)}/${entities.length}`,
      );
    }
    return saved;
  }
}
