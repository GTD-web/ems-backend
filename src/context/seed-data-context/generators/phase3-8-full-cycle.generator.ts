import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';

// Phase 3
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';

// Phase 4
import { WbsEvaluationCriteria } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { EvaluatorType } from '@domain/core/evaluation-line/evaluation-line.types';

// Phase 5
import { Deliverable } from '@domain/core/deliverable/deliverable.entity';
import { DeliverableMapping } from '@domain/core/deliverable-mapping/deliverable-mapping.entity';
import {
  DeliverableType,
  DeliverableStatus,
} from '@domain/core/deliverable/deliverable.types';

// Phase 6
import { QuestionGroup } from '@domain/sub/question-group/question-group.entity';
import { EvaluationQuestion } from '@domain/sub/evaluation-question/evaluation-question.entity';
import { QuestionGroupMapping } from '@domain/sub/question-group-mapping/question-group-mapping.entity';

// Phase 7
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

// Phase 8
import { EvaluationResponse } from '@domain/sub/evaluation-response/evaluation-response.entity';
import { EvaluationResponseType } from '@domain/sub/evaluation-response/evaluation-response.types';

import {
  SeedDataConfig,
  SeedScenario,
  GeneratorResult,
  DEFAULT_STATE_DISTRIBUTION,
} from '../types';
import { ProbabilityUtil, ScoreGeneratorUtil } from '../utils';

const BATCH_SIZE = 500;
const CREATED_BY = 'seed-generator';

@Injectable()
export class Phase3To8FullCycleGenerator {
  private readonly logger = new Logger(Phase3To8FullCycleGenerator.name);

  constructor(
    // Phase 3
    @InjectRepository(EvaluationProjectAssignment)
    private readonly projectAssignmentRepository: Repository<EvaluationProjectAssignment>,
    @InjectRepository(EvaluationWbsAssignment)
    private readonly wbsAssignmentRepository: Repository<EvaluationWbsAssignment>,

    // Phase 4
    @InjectRepository(WbsEvaluationCriteria)
    private readonly wbsCriteriaRepository: Repository<WbsEvaluationCriteria>,
    @InjectRepository(EvaluationLine)
    private readonly evaluationLineRepository: Repository<EvaluationLine>,
    @InjectRepository(EvaluationLineMapping)
    private readonly evaluationLineMappingRepository: Repository<EvaluationLineMapping>,

    // Phase 5
    @InjectRepository(Deliverable)
    private readonly deliverableRepository: Repository<Deliverable>,
    @InjectRepository(DeliverableMapping)
    private readonly deliverableMappingRepository: Repository<DeliverableMapping>,

    // Phase 6
    @InjectRepository(QuestionGroup)
    private readonly questionGroupRepository: Repository<QuestionGroup>,
    @InjectRepository(EvaluationQuestion)
    private readonly evaluationQuestionRepository: Repository<EvaluationQuestion>,
    @InjectRepository(QuestionGroupMapping)
    private readonly questionGroupMappingRepository: Repository<QuestionGroupMapping>,

    // Phase 7
    @InjectRepository(WbsSelfEvaluation)
    private readonly wbsSelfEvaluationRepository: Repository<WbsSelfEvaluation>,
    @InjectRepository(DownwardEvaluation)
    private readonly downwardEvaluationRepository: Repository<DownwardEvaluation>,
    @InjectRepository(PeerEvaluation)
    private readonly peerEvaluationRepository: Repository<PeerEvaluation>,
    @InjectRepository(FinalEvaluation)
    private readonly finalEvaluationRepository: Repository<FinalEvaluation>,

    // Phase 8
    @InjectRepository(EvaluationResponse)
    private readonly evaluationResponseRepository: Repository<EvaluationResponse>,
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

    this.logger.log(`Phase 3-8 시작 (시나리오: ${config.scenario})`);

    const results: Partial<GeneratorResult> = {
      phase: 'Phase3-8',
      entityCounts: {},
      generatedIds: {},
    };

    // Phase 3: 프로젝트 및 WBS 할당
    if (this.shouldRunPhase(3, config.scenario)) {
      await this.실행_Phase3(phase1Result, phase2Result, dist, results);
    }

    // Phase 4: 평가 기준 및 라인
    if (this.shouldRunPhase(4, config.scenario)) {
      await this.실행_Phase4(phase1Result, phase2Result, dist, results);
    }

    // Phase 5: 산출물
    if (this.shouldRunPhase(5, config.scenario)) {
      await this.실행_Phase5(phase1Result, phase2Result, dist, results);
    }

    // Phase 6: 질문 그룹 및 질문
    if (this.shouldRunPhase(6, config.scenario)) {
      await this.실행_Phase6(config, dist, results);
    }

    // Phase 7: 평가 실행
    if (this.shouldRunPhase(7, config.scenario)) {
      await this.실행_Phase7(phase1Result, phase2Result, dist, results);
    }

    // Phase 8: 응답
    if (this.shouldRunPhase(8, config.scenario)) {
      await this.실행_Phase8(phase2Result, dist, results);
    }

    const duration = Date.now() - startTime;
    this.logger.log(`Phase 3-8 완료 (${duration}ms)`);

    return {
      phase: results.phase!,
      entityCounts: results.entityCounts!,
      generatedIds: results.generatedIds!,
      duration,
    };
  }

  private shouldRunPhase(phase: number, scenario: SeedScenario): boolean {
    const phaseMap = {
      [SeedScenario.MINIMAL]: 0,
      [SeedScenario.WITH_PERIOD]: 0,
      [SeedScenario.WITH_ASSIGNMENTS]: 3,
      [SeedScenario.WITH_SETUP]: 6,
      [SeedScenario.FULL]: 8,
    };
    return phase <= phaseMap[scenario];
  }

  // ==================== Phase 3: 프로젝트 및 WBS 할당 ====================

  private async 실행_Phase3(
    phase1Result: GeneratorResult,
    phase2Result: GeneratorResult,
    dist: typeof DEFAULT_STATE_DISTRIBUTION,
    results: Partial<GeneratorResult>,
  ): Promise<void> {
    this.logger.log('Phase 3: 프로젝트 및 WBS 할당 생성');

    const periodIds = phase2Result.generatedIds.periodIds!;
    const employeeIds = phase1Result.generatedIds.employeeIds!;
    const projectIds = phase1Result.generatedIds.projectIds!;
    const wbsIds = phase1Result.generatedIds.wbsIds!;

    // 1. EvaluationProjectAssignment 생성
    const projectAssignments = await this.생성_프로젝트_할당들(
      periodIds,
      employeeIds,
      projectIds,
    );
    this.logger.log(
      `생성 완료: EvaluationProjectAssignment ${projectAssignments.length}개`,
    );

    // 2. EvaluationWbsAssignment 생성
    const wbsAssignments = await this.생성_WBS_할당들(
      periodIds,
      employeeIds,
      projectIds,
      wbsIds,
    );
    this.logger.log(
      `생성 완료: EvaluationWbsAssignment ${wbsAssignments.length}개`,
    );

    results.entityCounts!.EvaluationProjectAssignment =
      projectAssignments.length;
    results.entityCounts!.EvaluationWbsAssignment = wbsAssignments.length;
    results.generatedIds!.projectAssignmentIds = projectAssignments.map(
      (pa) => pa.id,
    );
    results.generatedIds!.wbsAssignmentIds = wbsAssignments.map((wa) => wa.id);
  }

  private async 생성_프로젝트_할당들(
    periodIds: string[],
    employeeIds: string[],
    projectIds: string[],
  ): Promise<EvaluationProjectAssignment[]> {
    const assignments: EvaluationProjectAssignment[] = [];

    // 첫 번째 평가기간에만 할당 (간단화)
    const periodId = periodIds[0];
    // 첫 번째 직원을 할당자로 사용 (관리자 역할)
    const assignerId = employeeIds[0];

    // 각 직원에게 1-3개의 프로젝트 할당
    for (const employeeId of employeeIds) {
      const projectCount = ProbabilityUtil.randomInt(
        1,
        Math.min(3, projectIds.length),
      );
      const selectedProjects = this.랜덤_선택(projectIds, projectCount);

      for (let i = 0; i < selectedProjects.length; i++) {
        const assignment = new EvaluationProjectAssignment();
        assignment.periodId = periodId;
        assignment.employeeId = employeeId;
        assignment.projectId = selectedProjects[i];
        assignment.assignedBy = assignerId;
        assignment.assignedDate = new Date();
        assignment.displayOrder = i;
        assignment.createdBy = assignerId;
        assignments.push(assignment);
      }
    }

    return await this.프로젝트_할당을_배치로_저장한다(assignments);
  }

  private async 생성_WBS_할당들(
    periodIds: string[],
    employeeIds: string[],
    projectIds: string[],
    wbsIds: string[],
  ): Promise<EvaluationWbsAssignment[]> {
    const assignments: EvaluationWbsAssignment[] = [];
    const periodId = periodIds[0];
    // 첫 번째 직원을 할당자로 사용 (관리자 역할)
    const assignerId = employeeIds[0];

    // 각 직원의 프로젝트별로 WBS 할당
    for (const employeeId of employeeIds) {
      const employeeProjects = this.랜덤_선택(
        projectIds,
        Math.min(2, projectIds.length),
      );

      for (const projectId of employeeProjects) {
        // 해당 프로젝트의 WBS 중 일부 선택 (실제로는 WBS의 projectId로 필터링 필요)
        const wbsCount = ProbabilityUtil.randomInt(2, 5);
        const selectedWbs = this.랜덤_선택(
          wbsIds,
          Math.min(wbsCount, wbsIds.length),
        );

        for (let i = 0; i < selectedWbs.length; i++) {
          const assignment = new EvaluationWbsAssignment();
          assignment.periodId = periodId;
          assignment.employeeId = employeeId;
          assignment.projectId = projectId;
          assignment.wbsItemId = selectedWbs[i];
          assignment.assignedBy = assignerId;
          assignment.assignedDate = new Date();
          assignment.displayOrder = i;
          assignment.createdBy = assignerId;
          assignments.push(assignment);
        }
      }
    }

    return await this.WBS_할당을_배치로_저장한다(assignments);
  }

  // ==================== Phase 4: 평가 기준 및 라인 ====================

  private async 실행_Phase4(
    phase1Result: GeneratorResult,
    phase2Result: GeneratorResult,
    dist: typeof DEFAULT_STATE_DISTRIBUTION,
    results: Partial<GeneratorResult>,
  ): Promise<void> {
    this.logger.log('Phase 4: 평가 기준 및 라인 생성');

    const wbsIds = phase1Result.generatedIds.wbsIds!;
    const employeeIds = phase1Result.generatedIds.employeeIds!;

    // 1. WBS 평가 기준 생성
    const criteria = await this.생성_WBS평가기준들(wbsIds, dist);
    this.logger.log(`생성 완료: WbsEvaluationCriteria ${criteria.length}개`);

    // 2. 평가 라인 생성 (primary, secondary)
    const evaluationLines = await this.생성_평가라인들();
    this.logger.log(`생성 완료: EvaluationLine ${evaluationLines.length}개`);

    // 3. 평가 라인 매핑 생성
    const lineMappings = await this.생성_평가라인매핑들(
      employeeIds,
      evaluationLines,
      dist,
    );
    this.logger.log(
      `생성 완료: EvaluationLineMapping ${lineMappings.length}개`,
    );

    results.entityCounts!.WbsEvaluationCriteria = criteria.length;
    results.entityCounts!.EvaluationLine = evaluationLines.length;
    results.entityCounts!.EvaluationLineMapping = lineMappings.length;
    results.generatedIds!.criteriaIds = criteria.map((c) => c.id);
    results.generatedIds!.evaluationLineIds = evaluationLines.map(
      (el) => el.id,
    );
    results.generatedIds!.lineMappingIds = lineMappings.map((lm) => lm.id);
  }

  private async 생성_WBS평가기준들(
    wbsIds: string[],
    dist: typeof DEFAULT_STATE_DISTRIBUTION,
  ): Promise<WbsEvaluationCriteria[]> {
    const allCriteria: WbsEvaluationCriteria[] = [];

    for (const wbsId of wbsIds) {
      const criteriaCount = ProbabilityUtil.randomInt(
        dist.wbsCriteriaPerWbs.min,
        dist.wbsCriteriaPerWbs.max,
      );

      for (let i = 0; i < criteriaCount; i++) {
        const criteria = new WbsEvaluationCriteria();
        criteria.wbsItemId = wbsId;
        criteria.criteria = faker.lorem.sentence();
        criteria.createdBy = CREATED_BY;
        allCriteria.push(criteria);
      }
    }

    return await this.배치로_저장한다(
      this.wbsCriteriaRepository,
      allCriteria,
      'WBS 평가기준',
    );
  }

  private async 생성_평가라인들(): Promise<EvaluationLine[]> {
    const lines: EvaluationLine[] = [];

    // Primary 평가자 라인
    const primary = new EvaluationLine();
    primary.evaluatorType = EvaluatorType.PRIMARY;
    primary.order = 1;
    primary.isRequired = true;
    primary.isAutoAssigned = false;
    primary.createdBy = CREATED_BY;
    lines.push(primary);

    // Secondary 평가자 라인
    const secondary = new EvaluationLine();
    secondary.evaluatorType = EvaluatorType.SECONDARY;
    secondary.order = 2;
    secondary.isRequired = false;
    secondary.isAutoAssigned = false;
    secondary.createdBy = CREATED_BY;
    lines.push(secondary);

    return await this.evaluationLineRepository.save(lines);
  }

  private async 생성_평가라인매핑들(
    employeeIds: string[],
    evaluationLines: EvaluationLine[],
    dist: typeof DEFAULT_STATE_DISTRIBUTION,
  ): Promise<EvaluationLineMapping[]> {
    const mappings: EvaluationLineMapping[] = [];
    const primaryLine = evaluationLines.find(
      (el) => el.evaluatorType === EvaluatorType.PRIMARY,
    )!;
    const secondaryLine = evaluationLines.find(
      (el) => el.evaluatorType === EvaluatorType.SECONDARY,
    )!;

    for (let i = 0; i < employeeIds.length; i++) {
      const employeeId = employeeIds[i];

      // 다른 직원을 평가자로 선택 (자기 자신 제외)
      const otherEmployees = employeeIds.filter((id) => id !== employeeId);
      if (otherEmployees.length === 0) continue;

      // Primary 평가자 매핑
      const primaryEvaluator =
        otherEmployees[Math.floor(Math.random() * otherEmployees.length)];
      const primaryMapping = new EvaluationLineMapping();
      primaryMapping.employeeId = employeeId;
      primaryMapping.evaluatorId = primaryEvaluator;
      primaryMapping.evaluationLineId = primaryLine.id;
      primaryMapping.createdBy = CREATED_BY;
      mappings.push(primaryMapping);

      // Secondary 평가자 매핑 (확률적)
      const mappingType = ProbabilityUtil.selectByProbability(
        dist.evaluationLineMappingTypes,
      );
      if (
        mappingType === 'primaryAndSecondary' ||
        mappingType === 'withAdditional'
      ) {
        const availableSecondary = otherEmployees.filter(
          (id) => id !== primaryEvaluator,
        );
        if (availableSecondary.length > 0) {
          const secondaryEvaluator =
            availableSecondary[
              Math.floor(Math.random() * availableSecondary.length)
            ];
          const secondaryMapping = new EvaluationLineMapping();
          secondaryMapping.employeeId = employeeId;
          secondaryMapping.evaluatorId = secondaryEvaluator;
          secondaryMapping.evaluationLineId = secondaryLine.id;
          secondaryMapping.createdBy = CREATED_BY;
          mappings.push(secondaryMapping);
        }
      }
    }

    return await this.배치로_저장한다(
      this.evaluationLineMappingRepository,
      mappings,
      '평가 라인 매핑',
    );
  }

  // ==================== Phase 5: 산출물 ====================

  private async 실행_Phase5(
    phase1Result: GeneratorResult,
    phase2Result: GeneratorResult,
    dist: typeof DEFAULT_STATE_DISTRIBUTION,
    results: Partial<GeneratorResult>,
  ): Promise<void> {
    this.logger.log('Phase 5: 산출물 생성');

    const wbsIds = phase1Result.generatedIds.wbsIds!;
    const employeeIds = phase1Result.generatedIds.employeeIds!;

    // 1. Deliverable 생성
    const deliverables = await this.생성_산출물들(dist);
    this.logger.log(`생성 완료: Deliverable ${deliverables.length}개`);

    // 2. DeliverableMapping 생성
    const deliverableMappings = await this.생성_산출물매핑들(
      deliverables,
      wbsIds,
      employeeIds,
      dist,
    );
    this.logger.log(
      `생성 완료: DeliverableMapping ${deliverableMappings.length}개`,
    );

    results.entityCounts!.Deliverable = deliverables.length;
    results.entityCounts!.DeliverableMapping = deliverableMappings.length;
    results.generatedIds!.deliverableIds = deliverables.map((d) => d.id);
    results.generatedIds!.deliverableMappingIds = deliverableMappings.map(
      (dm) => dm.id,
    );
  }

  private async 생성_산출물들(
    dist: typeof DEFAULT_STATE_DISTRIBUTION,
  ): Promise<Deliverable[]> {
    const deliverables: Deliverable[] = [];
    const deliverableCount = 20; // 기본 20개 산출물 생성

    const deliverableTypes: DeliverableType[] = [
      DeliverableType.DOCUMENT,
      DeliverableType.CODE,
      DeliverableType.DESIGN,
      DeliverableType.REPORT,
      DeliverableType.PRESENTATION,
      DeliverableType.OTHER,
    ];
    const deliverableStatuses: DeliverableStatus[] = [
      DeliverableStatus.PENDING,
      DeliverableStatus.IN_PROGRESS,
      DeliverableStatus.COMPLETED,
      DeliverableStatus.REJECTED,
    ];

    for (let i = 0; i < deliverableCount; i++) {
      const deliverable = new Deliverable();
      deliverable.name = faker.commerce.productName();
      deliverable.description = faker.lorem.sentence();
      deliverable.type =
        deliverableTypes[Math.floor(Math.random() * deliverableTypes.length)];
      deliverable.status =
        deliverableStatuses[
          Math.floor(Math.random() * deliverableStatuses.length)
        ];

      const typeChoice = ProbabilityUtil.selectByProbability(
        dist.deliverableType,
      );
      deliverable.filePath =
        typeChoice === 'url'
          ? faker.internet.url()
          : `/nas/project/${faker.string.uuid()}/file.pdf`;

      deliverable.fileSize = faker.number.int({ min: 1024, max: 10485760 });
      deliverable.mimeType = 'application/pdf';
      deliverable.createdBy = CREATED_BY;
      deliverables.push(deliverable);
    }

    return await this.배치로_저장한다(
      this.deliverableRepository,
      deliverables,
      '산출물',
    );
  }

  private async 생성_산출물매핑들(
    deliverables: Deliverable[],
    wbsIds: string[],
    employeeIds: string[],
    dist: typeof DEFAULT_STATE_DISTRIBUTION,
  ): Promise<DeliverableMapping[]> {
    const mappings: DeliverableMapping[] = [];

    for (const wbsId of wbsIds) {
      const deliverableCountChoice = ProbabilityUtil.selectByProbability(
        dist.deliverablePerWbs,
      );

      let deliverableCount = 0;
      switch (deliverableCountChoice) {
        case 'none':
          deliverableCount = 0;
          break;
        case 'one':
          deliverableCount = 1;
          break;
        case 'twoToThree':
          deliverableCount = ProbabilityUtil.randomInt(2, 3);
          break;
        case 'fourOrMore':
          deliverableCount = ProbabilityUtil.randomInt(4, 6);
          break;
      }

      const selectedDeliverables = this.랜덤_선택(
        deliverables,
        Math.min(deliverableCount, deliverables.length),
      );

      for (const deliverable of selectedDeliverables) {
        const randomEmployee =
          employeeIds[Math.floor(Math.random() * employeeIds.length)];

        const mapping = new DeliverableMapping();
        mapping.employeeId = randomEmployee;
        mapping.wbsItemId = wbsId;
        mapping.deliverableId = deliverable.id;
        mapping.mappedBy = CREATED_BY;
        mapping.mappedDate = new Date();
        mapping.isActive = true;
        mapping.createdBy = CREATED_BY;
        mappings.push(mapping);
      }
    }

    return await this.배치로_저장한다(
      this.deliverableMappingRepository,
      mappings,
      '산출물 매핑',
    );
  }

  // ==================== Phase 6: 질문 그룹 및 질문 ====================

  private async 실행_Phase6(
    config: SeedDataConfig,
    dist: typeof DEFAULT_STATE_DISTRIBUTION,
    results: Partial<GeneratorResult>,
  ): Promise<void> {
    this.logger.log('Phase 6: 질문 그룹 및 질문 생성');

    // 1. QuestionGroup 생성
    const questionGroups = await this.생성_질문그룹들(dist);
    this.logger.log(`생성 완료: QuestionGroup ${questionGroups.length}개`);

    // 2. EvaluationQuestion 생성
    const questions = await this.생성_평가질문들(dist);
    this.logger.log(`생성 완료: EvaluationQuestion ${questions.length}개`);

    // 3. QuestionGroupMapping 생성
    const groupMappings = await this.생성_질문그룹매핑들(
      questionGroups,
      questions,
      dist,
    );
    this.logger.log(
      `생성 완료: QuestionGroupMapping ${groupMappings.length}개`,
    );

    results.entityCounts!.QuestionGroup = questionGroups.length;
    results.entityCounts!.EvaluationQuestion = questions.length;
    results.entityCounts!.QuestionGroupMapping = groupMappings.length;
    results.generatedIds!.questionGroupIds = questionGroups.map((qg) => qg.id);
    results.generatedIds!.questionIds = questions.map((q) => q.id);
    results.generatedIds!.questionGroupMappingIds = groupMappings.map(
      (qgm) => qgm.id,
    );
  }

  private async 생성_질문그룹들(
    dist: typeof DEFAULT_STATE_DISTRIBUTION,
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
      group.createdBy = CREATED_BY;
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

      question.createdBy = CREATED_BY;
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
        mapping.createdBy = CREATED_BY;
        mappings.push(mapping);
      }
    }

    return await this.배치로_저장한다(
      this.questionGroupMappingRepository,
      mappings,
      '질문 그룹 매핑',
    );
  }

  // ==================== Phase 7: 평가 실행 ====================

  private async 실행_Phase7(
    phase1Result: GeneratorResult,
    phase2Result: GeneratorResult,
    dist: typeof DEFAULT_STATE_DISTRIBUTION,
    results: Partial<GeneratorResult>,
  ): Promise<void> {
    this.logger.log('Phase 7: 평가 실행 생성');

    const employeeIds = phase1Result.generatedIds.employeeIds!;
    const wbsAssignmentIds = results.generatedIds?.wbsAssignmentIds || [];
    const periodIds = phase2Result.generatedIds.periodIds!;

    // 1. WbsSelfEvaluation 생성 (간소화)
    const selfEvaluations = await this.생성_자기평가들(
      employeeIds,
      periodIds,
      dist,
    );
    this.logger.log(`생성 완료: WbsSelfEvaluation ${selfEvaluations.length}개`);

    // 2. DownwardEvaluation 생성 (간소화)
    const downwardEvaluations = await this.생성_하향평가들(
      employeeIds,
      periodIds,
      dist,
    );
    this.logger.log(
      `생성 완료: DownwardEvaluation ${downwardEvaluations.length}개`,
    );

    // 3. PeerEvaluation 생성 (간소화)
    const peerEvaluations = await this.생성_동료평가들(
      employeeIds,
      periodIds,
      dist,
    );
    this.logger.log(`생성 완료: PeerEvaluation ${peerEvaluations.length}개`);

    // 4. FinalEvaluation 생성 (간소화)
    const finalEvaluations = await this.생성_최종평가들(
      employeeIds,
      periodIds,
      dist,
    );
    this.logger.log(`생성 완료: FinalEvaluation ${finalEvaluations.length}개`);

    results.entityCounts!.WbsSelfEvaluation = selfEvaluations.length;
    results.entityCounts!.DownwardEvaluation = downwardEvaluations.length;
    results.entityCounts!.PeerEvaluation = peerEvaluations.length;
    results.entityCounts!.FinalEvaluation = finalEvaluations.length;
    results.generatedIds!.selfEvaluationIds = selfEvaluations.map(
      (se) => se.id,
    );
    results.generatedIds!.downwardEvaluationIds = downwardEvaluations.map(
      (de) => de.id,
    );
    results.generatedIds!.peerEvaluationIds = peerEvaluations.map(
      (pe) => pe.id,
    );
    results.generatedIds!.finalEvaluationIds = finalEvaluations.map(
      (fe) => fe.id,
    );
  }

  private async 생성_자기평가들(
    employeeIds: string[],
    periodIds: string[],
    dist: typeof DEFAULT_STATE_DISTRIBUTION,
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
        evaluation.assignedBy = CREATED_BY;
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
        evaluation.createdBy = employeeId;
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
      evaluation.projectId = dummyProjectId;
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
      evaluation.mappedBy = CREATED_BY;
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

      evaluation.createdBy = employeeIds[(i + 1) % employeeIds.length];
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
  ): Promise<FinalEvaluation[]> {
    const evaluations: FinalEvaluation[] = [];
    const periodId = periodIds[0];

    const evaluationGrades = ['S', 'A', 'B', 'C', 'D'];
    const jobGrades = [JobGrade.T1, JobGrade.T2, JobGrade.T3];
    const jobDetailedGrades = [
      JobDetailedGrade.U,
      JobDetailedGrade.N,
      JobDetailedGrade.A,
    ];

    // 간소화: 일부 직원에 대해서만 최종평가 생성
    for (let i = 0; i < Math.min(5, employeeIds.length); i++) {
      const evaluation = new FinalEvaluation();
      evaluation.employeeId = employeeIds[i];
      evaluation.periodId = periodId;

      evaluation.evaluationGrade =
        evaluationGrades[Math.floor(Math.random() * evaluationGrades.length)];
      evaluation.jobGrade =
        jobGrades[Math.floor(Math.random() * jobGrades.length)];
      evaluation.jobDetailedGrade =
        jobDetailedGrades[Math.floor(Math.random() * jobDetailedGrades.length)];

      const statusChoice = ProbabilityUtil.selectByProbability(
        dist.finalEvaluationProgress,
      );
      evaluation.isConfirmed = statusChoice === 'completed';
      if (evaluation.isConfirmed) {
        evaluation.confirmedAt = new Date();
        evaluation.confirmedBy = CREATED_BY;
      }

      evaluation.finalComments = faker.lorem.paragraph();
      evaluation.createdBy = CREATED_BY;
      evaluations.push(evaluation);
    }

    return await this.배치로_저장한다(
      this.finalEvaluationRepository,
      evaluations,
      '최종평가',
    );
  }

  // ==================== Phase 8: 응답 ====================

  private async 실행_Phase8(
    phase2Result: GeneratorResult,
    dist: typeof DEFAULT_STATE_DISTRIBUTION,
    results: Partial<GeneratorResult>,
  ): Promise<void> {
    this.logger.log('Phase 8: 응답 생성');

    const questionIds = results.generatedIds?.questionIds || [];
    const selfEvaluationIds = results.generatedIds?.selfEvaluationIds || [];

    // EvaluationResponse 생성 (간소화)
    const responses = await this.생성_평가응답들(
      questionIds,
      selfEvaluationIds,
      dist,
    );
    this.logger.log(`생성 완료: EvaluationResponse ${responses.length}개`);

    results.entityCounts!.EvaluationResponse = responses.length;
    results.generatedIds!.responseIds = responses.map((r) => r.id);
  }

  private async 생성_평가응답들(
    questionIds: string[],
    evaluationIds: string[],
    dist: typeof DEFAULT_STATE_DISTRIBUTION,
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
          response.createdBy = CREATED_BY;
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

  private async 프로젝트_할당을_배치로_저장한다(
    assignments: EvaluationProjectAssignment[],
  ): Promise<EvaluationProjectAssignment[]> {
    return await this.배치로_저장한다(
      this.projectAssignmentRepository,
      assignments,
      '프로젝트 할당',
    );
  }

  private async WBS_할당을_배치로_저장한다(
    assignments: EvaluationWbsAssignment[],
  ): Promise<EvaluationWbsAssignment[]> {
    return await this.배치로_저장한다(
      this.wbsAssignmentRepository,
      assignments,
      'WBS 할당',
    );
  }

  // 공통 배치 저장 메서드
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
