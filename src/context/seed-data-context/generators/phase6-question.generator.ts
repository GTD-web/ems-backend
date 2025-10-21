import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';

import { QuestionGroup } from '@domain/sub/question-group/question-group.entity';
import { EvaluationQuestion } from '@domain/sub/evaluation-question/evaluation-question.entity';
import { QuestionGroupMapping } from '@domain/sub/question-group-mapping/question-group-mapping.entity';

import {
  SeedDataConfig,
  GeneratorResult,
  DEFAULT_STATE_DISTRIBUTION,
} from '../types';
import { ProbabilityUtil } from '../utils';

const BATCH_SIZE = 500;

@Injectable()
export class Phase6QuestionGenerator {
  private readonly logger = new Logger(Phase6QuestionGenerator.name);

  constructor(
    @InjectRepository(QuestionGroup)
    private readonly questionGroupRepository: Repository<QuestionGroup>,
    @InjectRepository(EvaluationQuestion)
    private readonly evaluationQuestionRepository: Repository<EvaluationQuestion>,
    @InjectRepository(QuestionGroupMapping)
    private readonly questionGroupMappingRepository: Repository<QuestionGroupMapping>,
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

    this.logger.log('Phase 6: 질문 그룹 및 질문 생성');

    const systemAdminId = phase1Result.generatedIds.systemAdminId as string;

    // 1. QuestionGroup 생성
    const questionGroups = await this.생성_질문그룹들(dist, systemAdminId);
    this.logger.log(`생성 완료: QuestionGroup ${questionGroups.length}개`);

    // 2. EvaluationQuestion 생성
    const questions = await this.생성_평가질문들(dist, systemAdminId);
    this.logger.log(`생성 완료: EvaluationQuestion ${questions.length}개`);

    // 3. QuestionGroupMapping 생성
    const groupMappings = await this.생성_질문그룹매핑들(
      questionGroups,
      questions,
      dist,
      systemAdminId,
    );
    this.logger.log(
      `생성 완료: QuestionGroupMapping ${groupMappings.length}개`,
    );

    const duration = Date.now() - startTime;
    this.logger.log(`Phase 6 완료 (${duration}ms)`);

    return {
      phase: 'Phase6',
      entityCounts: {
        QuestionGroup: questionGroups.length,
        EvaluationQuestion: questions.length,
        QuestionGroupMapping: groupMappings.length,
      },
      generatedIds: {
        questionGroupIds: questionGroups.map((qg) => qg.id),
        questionIds: questions.map((q) => q.id),
        questionGroupMappingIds: groupMappings.map((qgm) => qgm.id),
      },
      duration,
    };
  }

  private async 생성_질문그룹들(
    dist: typeof DEFAULT_STATE_DISTRIBUTION,
    systemAdminId: string,
  ): Promise<QuestionGroup[]> {
    const groups: QuestionGroup[] = [];
    const groupCount = ProbabilityUtil.randomInt(
      dist.questionGroupCount.min,
      dist.questionGroupCount.max,
    );

    for (let i = 0; i < groupCount; i++) {
      const group = new QuestionGroup();
      group.name = `${faker.company.buzzVerb()} ${faker.company.buzzNoun()} 그룹 ${i + 1}`;
      group.isDefault =
        Math.random() < dist.questionGroupSpecial.defaultGroupRatio;
      group.isDeletable =
        !group.isDefault &&
        Math.random() > dist.questionGroupSpecial.nonDeletableRatio;
      group.createdBy = systemAdminId;
      groups.push(group);
    }

    return await this.배치로_저장한다(
      this.questionGroupRepository,
      groups,
      '질문 그룹',
    );
  }

  private async 생성_평가질문들(
    dist: typeof DEFAULT_STATE_DISTRIBUTION,
    systemAdminId: string,
  ): Promise<EvaluationQuestion[]> {
    const questions: EvaluationQuestion[] = [];
    const questionCount = ProbabilityUtil.randomInt(15, 30);

    for (let i = 0; i < questionCount; i++) {
      const question = new EvaluationQuestion();
      question.text = faker.lorem.sentence() + '?';

      const questionTypeChoice = ProbabilityUtil.selectByProbability(
        dist.questionType,
      );

      if (
        questionTypeChoice === 'scoreOnly' ||
        questionTypeChoice === 'scoreAndText'
      ) {
        question.minScore = 0;
        question.maxScore = 100;
      }

      question.createdBy = systemAdminId;
      questions.push(question);
    }

    return await this.배치로_저장한다(
      this.evaluationQuestionRepository,
      questions,
      '평가 질문',
    );
  }

  private async 생성_질문그룹매핑들(
    questionGroups: QuestionGroup[],
    questions: EvaluationQuestion[],
    dist: typeof DEFAULT_STATE_DISTRIBUTION,
    systemAdminId: string,
  ): Promise<QuestionGroupMapping[]> {
    const mappings: QuestionGroupMapping[] = [];

    for (const question of questions) {
      const mappingRatioChoice = ProbabilityUtil.selectByProbability(
        dist.questionGroupMappingRatio,
      );

      let groupCount = 1;
      switch (mappingRatioChoice) {
        case 'singleGroup':
          groupCount = 1;
          break;
        case 'twoGroups':
          groupCount = 2;
          break;
        case 'threeOrMore':
          groupCount = ProbabilityUtil.randomInt(3, 4);
          break;
      }

      const selectedGroups = this.랜덤_선택(
        questionGroups,
        Math.min(groupCount, questionGroups.length),
      );

      for (let i = 0; i < selectedGroups.length; i++) {
        const mapping = new QuestionGroupMapping();
        mapping.groupId = selectedGroups[i].id;
        mapping.questionId = question.id;
        mapping.displayOrder = i;
        mapping.createdBy = systemAdminId;
        mappings.push(mapping);
      }
    }

    return await this.배치로_저장한다(
      this.questionGroupMappingRepository,
      mappings,
      '질문 그룹 매핑',
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
