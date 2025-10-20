import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import {
  SeedDataConfig,
  SeedScenario,
  GeneratorResult,
  DEFAULT_STATE_DISTRIBUTION,
} from '../types';
import { ProbabilityUtil } from '../utils';

const BATCH_SIZE = 500;
const CREATED_BY = 'seed-generator';

@Injectable()
export class Phase3To8FullCycleGenerator {
  private readonly logger = new Logger(Phase3To8FullCycleGenerator.name);

  constructor(
    @InjectRepository(EvaluationProjectAssignment)
    private readonly projectAssignmentRepository: Repository<EvaluationProjectAssignment>,
    @InjectRepository(EvaluationWbsAssignment)
    private readonly wbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
    // TODO: Phase 4-8 repositories 추가
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

  // ==================== Phase 4-8: TODO ====================

  private async 실행_Phase4(
    phase1Result: GeneratorResult,
    phase2Result: GeneratorResult,
    dist: typeof DEFAULT_STATE_DISTRIBUTION,
    results: Partial<GeneratorResult>,
  ): Promise<void> {
    this.logger.log('Phase 4: 평가 기준 및 라인 (TODO)');
    // TODO: WbsEvaluationCriteria, EvaluationLine, EvaluationLineMapping 생성
  }

  private async 실행_Phase5(
    phase1Result: GeneratorResult,
    phase2Result: GeneratorResult,
    dist: typeof DEFAULT_STATE_DISTRIBUTION,
    results: Partial<GeneratorResult>,
  ): Promise<void> {
    this.logger.log('Phase 5: 산출물 (TODO)');
    // TODO: Deliverable, DeliverableMapping 생성
  }

  private async 실행_Phase6(
    config: SeedDataConfig,
    dist: typeof DEFAULT_STATE_DISTRIBUTION,
    results: Partial<GeneratorResult>,
  ): Promise<void> {
    this.logger.log('Phase 6: 질문 그룹 및 질문 (TODO)');
    // TODO: QuestionGroup, EvaluationQuestion, QuestionGroupMapping 생성
  }

  private async 실행_Phase7(
    phase1Result: GeneratorResult,
    phase2Result: GeneratorResult,
    dist: typeof DEFAULT_STATE_DISTRIBUTION,
    results: Partial<GeneratorResult>,
  ): Promise<void> {
    this.logger.log('Phase 7: 평가 실행 (TODO)');
    // TODO: WbsSelfEvaluation, DownwardEvaluation, PeerEvaluation, FinalEvaluation 생성
  }

  private async 실행_Phase8(
    phase2Result: GeneratorResult,
    dist: typeof DEFAULT_STATE_DISTRIBUTION,
    results: Partial<GeneratorResult>,
  ): Promise<void> {
    this.logger.log('Phase 8: 응답 (TODO)');
    // TODO: EvaluationResponse 생성
  }

  // ==================== 유틸리티 메서드 ====================

  private 랜덤_선택<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  private async 프로젝트_할당을_배치로_저장한다(
    assignments: EvaluationProjectAssignment[],
  ): Promise<EvaluationProjectAssignment[]> {
    const saved: EvaluationProjectAssignment[] = [];
    for (let i = 0; i < assignments.length; i += BATCH_SIZE) {
      const batch = assignments.slice(i, i + BATCH_SIZE);
      const result = await this.projectAssignmentRepository.save(batch);
      saved.push(...result);
      this.logger.log(
        `프로젝트 할당 저장 진행: ${Math.min(i + BATCH_SIZE, assignments.length)}/${assignments.length}`,
      );
    }
    return saved;
  }

  private async WBS_할당을_배치로_저장한다(
    assignments: EvaluationWbsAssignment[],
  ): Promise<EvaluationWbsAssignment[]> {
    const saved: EvaluationWbsAssignment[] = [];
    for (let i = 0; i < assignments.length; i += BATCH_SIZE) {
      const batch = assignments.slice(i, i + BATCH_SIZE);
      const result = await this.wbsAssignmentRepository.save(batch);
      saved.push(...result);
      this.logger.log(
        `WBS 할당 저장 진행: ${Math.min(i + BATCH_SIZE, assignments.length)}/${assignments.length}`,
      );
    }
    return saved;
  }
}
