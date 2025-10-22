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

    // 1. WbsSelfEvaluation 생성 (간소화)
    const selfEvaluations = await this.생성_자기평가들(
      employeeIds,
      periodIds,
      dist,
      systemAdminId,
    );
    this.logger.log(`생성 완료: WbsSelfEvaluation ${selfEvaluations.length}개`);

    // 2. DownwardEvaluation 생성 (간소화)
    const downwardEvaluations = await this.생성_하향평가들(
      employeeIds,
      periodIds,
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
    dist: typeof DEFAULT_STATE_DISTRIBUTION,
    systemAdminId: string,
  ): Promise<WbsSelfEvaluation[]> {
    const evaluations: WbsSelfEvaluation[] = [];
    const periodId = periodIds[0];

    // WBS 할당이 필요하므로 간단히 첫 번째 WBS ID를 사용 (실제로는 results에서 가져와야 함)
    const dummyWbsId = '00000000-0000-0000-0000-000000000000';

    // 간소화: 직원별로 1-2개의 자기평가 생성
    for (const employeeId of employeeIds) {
      const evalCount = ProbabilityUtil.randomInt(1, 2);

      for (let i = 0; i < evalCount; i++) {
        const evaluation = new WbsSelfEvaluation();
        evaluation.employeeId = employeeId;
        evaluation.periodId = periodId;
        evaluation.wbsItemId = dummyWbsId;
        evaluation.assignedBy = systemAdminId;
        evaluation.assignedDate = new Date();
        evaluation.evaluationDate = new Date();

        const statusChoice = ProbabilityUtil.selectByProbability(
          dist.selfEvaluationProgress,
        );
        evaluation.isCompleted = statusChoice === 'completed';
        if (evaluation.isCompleted) {
          evaluation.completedAt = new Date();
        }

        evaluation.selfEvaluationScore = ScoreGeneratorUtil.generateNormalScore(
          dist.scoreGeneration.min,
          dist.scoreGeneration.max,
          dist.scoreGeneration.mean!,
          dist.scoreGeneration.stdDev!,
        );
        evaluation.selfEvaluationContent = faker.lorem.paragraph();
        evaluation.performanceResult = faker.lorem.paragraph();
        evaluation.createdBy = systemAdminId;
        evaluations.push(evaluation);
      }
    }

    return await this.배치로_저장한다(
      this.wbsSelfEvaluationRepository,
      evaluations,
      '자기평가',
    );
  }

  private async 생성_하향평가들(
    employeeIds: string[],
    periodIds: string[],
    dist: typeof DEFAULT_STATE_DISTRIBUTION,
    systemAdminId: string,
  ): Promise<DownwardEvaluation[]> {
    const evaluations: DownwardEvaluation[] = [];
    const periodId = periodIds[0];
    const dummyProjectId = '00000000-0000-0000-0000-000000000000';

    // 간소화: 직원별로 1개의 하향평가 생성
    for (let i = 0; i < employeeIds.length - 1; i++) {
      const evaluation = new DownwardEvaluation();
      evaluation.employeeId = employeeIds[i];
      evaluation.evaluatorId = employeeIds[i + 1];
      evaluation.periodId = periodId;
      evaluation.wbsId = dummyProjectId;
      evaluation.evaluationType =
        Math.random() < 0.7
          ? DownwardEvaluationType.PRIMARY
          : DownwardEvaluationType.SECONDARY;
      evaluation.evaluationDate = new Date();

      const statusChoice = ProbabilityUtil.selectByProbability(
        dist.downwardEvaluationProgress,
      );
      evaluation.isCompleted = statusChoice === 'completed';
      if (evaluation.isCompleted) {
        evaluation.completedAt = new Date();
      }

      evaluation.downwardEvaluationScore =
        ScoreGeneratorUtil.generateNormalScore(
          dist.scoreGeneration.min,
          dist.scoreGeneration.max,
          dist.scoreGeneration.mean!,
          dist.scoreGeneration.stdDev!,
        );
      evaluation.downwardEvaluationContent = faker.lorem.paragraph();
      evaluation.createdBy = employeeIds[i + 1];
      evaluations.push(evaluation);
    }

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
