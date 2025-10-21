import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';

import { EvaluationResponse } from '@domain/sub/evaluation-response/evaluation-response.entity';
import { EvaluationResponseType } from '@domain/sub/evaluation-response/evaluation-response.types';

import {
  SeedDataConfig,
  GeneratorResult,
  DEFAULT_STATE_DISTRIBUTION,
} from '../types';
import { ProbabilityUtil, ScoreGeneratorUtil } from '../utils';

const BATCH_SIZE = 500;

@Injectable()
export class Phase8ResponseGenerator {
  private readonly logger = new Logger(Phase8ResponseGenerator.name);

  constructor(
    @InjectRepository(EvaluationResponse)
    private readonly evaluationResponseRepository: Repository<EvaluationResponse>,
  ) {}

  async generate(
    config: SeedDataConfig,
    phase1Result: GeneratorResult,
    phase6Result: GeneratorResult,
    phase7Result: GeneratorResult,
  ): Promise<GeneratorResult> {
    const startTime = Date.now();
    const dist = {
      ...DEFAULT_STATE_DISTRIBUTION,
      ...config.stateDistribution,
    };

    this.logger.log('Phase 8: 응답 생성');

    const systemAdminId = phase1Result.generatedIds.systemAdminId as string;
    const questionIds = (phase6Result.generatedIds?.questionIds ||
      []) as string[];
    const selfEvaluationIds = (phase7Result.generatedIds?.selfEvaluationIds ||
      []) as string[];

    // EvaluationResponse 생성 (간소화)
    const responses = await this.생성_평가응답들(
      questionIds,
      selfEvaluationIds,
      dist,
      systemAdminId,
    );
    this.logger.log(`생성 완료: EvaluationResponse ${responses.length}개`);

    const duration = Date.now() - startTime;
    this.logger.log(`Phase 8 완료 (${duration}ms)`);

    return {
      phase: 'Phase8',
      entityCounts: {
        EvaluationResponse: responses.length,
      },
      generatedIds: {
        responseIds: responses.map((r) => r.id),
      },
      duration,
    };
  }

  private async 생성_평가응답들(
    questionIds: string[],
    evaluationIds: string[],
    dist: typeof DEFAULT_STATE_DISTRIBUTION,
    systemAdminId: string,
  ): Promise<EvaluationResponse[]> {
    const responses: EvaluationResponse[] = [];

    // 간소화: 일부 평가에 대해서만 응답 생성
    for (let i = 0; i < Math.min(10, evaluationIds.length); i++) {
      const evaluationId = evaluationIds[i];

      // 평가당 1-3개의 질문에 응답
      const questionCount = ProbabilityUtil.randomInt(
        1,
        Math.min(3, questionIds.length),
      );
      const selectedQuestions = this.랜덤_선택(questionIds, questionCount);

      for (const questionId of selectedQuestions) {
        const shouldRespond =
          Math.random() < dist.evaluationResponseRatio.hasResponse;

        if (shouldRespond) {
          const response = new EvaluationResponse();
          response.questionId = questionId;
          response.evaluationId = evaluationId;
          response.evaluationType = EvaluationResponseType.SELF;
          response.score = ScoreGeneratorUtil.generateNormalScore(
            dist.scoreGeneration.min,
            dist.scoreGeneration.max,
            dist.scoreGeneration.mean!,
            dist.scoreGeneration.stdDev!,
          );
          response.answer = faker.lorem.paragraph();
          response.createdBy = systemAdminId;
          responses.push(response);
        }
      }
    }

    return await this.배치로_저장한다(
      this.evaluationResponseRepository,
      responses,
      '평가 응답',
    );
  }

  // ==================== 유틸리티 메서드 ====================

  private 랜덤_선택<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
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
