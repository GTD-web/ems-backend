import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';

import {
  SeedDataConfig,
  GeneratorResult,
  DEFAULT_STATE_DISTRIBUTION,
} from '../types';
import { ProbabilityUtil } from '../utils';

const BATCH_SIZE = 500;

@Injectable()
export class Phase3AssignmentGenerator {
  private readonly logger = new Logger(Phase3AssignmentGenerator.name);

  constructor(
    @InjectRepository(EvaluationProjectAssignment)
    private readonly projectAssignmentRepository: Repository<EvaluationProjectAssignment>,
    @InjectRepository(EvaluationWbsAssignment)
    private readonly wbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
    @InjectRepository(WbsItem)
    private readonly wbsItemRepository: Repository<WbsItem>,
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

    this.logger.log('Phase 3: 프로젝트 및 WBS 할당 생성');

    const systemAdminId = phase1Result.generatedIds.systemAdminId as string;
    const periodIds = phase2Result.generatedIds.periodIds as string[];
    const employeeIds = phase1Result.generatedIds.employeeIds as string[];
    const projectIds = phase1Result.generatedIds.projectIds as string[];
    const wbsIds = phase1Result.generatedIds.wbsIds as string[];

    // 1. EvaluationProjectAssignment 생성
    const projectAssignments = await this.생성_프로젝트_할당들(
      periodIds,
      employeeIds,
      projectIds,
      systemAdminId,
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
      systemAdminId,
    );
    this.logger.log(
      `생성 완료: EvaluationWbsAssignment ${wbsAssignments.length}개`,
    );

    const duration = Date.now() - startTime;
    this.logger.log(`Phase 3 완료 (${duration}ms)`);

    return {
      phase: 'Phase3',
      entityCounts: {
        EvaluationProjectAssignment: projectAssignments.length,
        EvaluationWbsAssignment: wbsAssignments.length,
      },
      generatedIds: {
        projectAssignmentIds: projectAssignments.map((pa) => pa.id),
        wbsAssignmentIds: wbsAssignments.map((wa) => wa.id),
      },
      duration,
    };
  }

  private async 생성_프로젝트_할당들(
    periodIds: string[],
    employeeIds: string[],
    projectIds: string[],
    systemAdminId: string,
  ): Promise<EvaluationProjectAssignment[]> {
    const assignments: EvaluationProjectAssignment[] = [];

    // 첫 번째 평가기간에만 할당 (간단화)
    const periodId = periodIds[0];
    // 시스템 관리자를 할당자로 사용
    const assignerId = systemAdminId;

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
        assignment.createdBy = systemAdminId;
        assignments.push(assignment);
      }
    }

    return await this.배치로_저장한다(
      this.projectAssignmentRepository,
      assignments,
      '프로젝트 할당',
    );
  }

  private async 생성_WBS_할당들(
    periodIds: string[],
    employeeIds: string[],
    projectIds: string[],
    wbsIds: string[],
    systemAdminId: string,
  ): Promise<EvaluationWbsAssignment[]> {
    const assignments: EvaluationWbsAssignment[] = [];
    const periodId = periodIds[0];
    // 시스템 관리자를 할당자로 사용
    const assignerId = systemAdminId;

    // 1. 프로젝트별로 WBS를 그룹화
    const wbsItemsByProject = await this.wbsItemRepository
      .createQueryBuilder('wbs')
      .select(['wbs.id', 'wbs.projectId'])
      .where('wbs.id IN (:...wbsIds)', { wbsIds })
      .andWhere('wbs.deletedAt IS NULL')
      .getRawMany();

    const projectWbsMap = new Map<string, string[]>();
    for (const wbs of wbsItemsByProject) {
      const projectId = wbs.wbs_projectId;
      if (!projectWbsMap.has(projectId)) {
        projectWbsMap.set(projectId, []);
      }
      projectWbsMap.get(projectId)!.push(wbs.wbs_id);
    }

    // 2. 이미 할당된 프로젝트 조회
    const projectAssignments = await this.projectAssignmentRepository
      .createQueryBuilder('assignment')
      .select([
        'assignment.employeeId AS assignment_employeeid',
        'assignment.projectId AS assignment_projectid',
      ])
      .where('assignment.periodId = :periodId', { periodId })
      .andWhere('assignment.deletedAt IS NULL')
      .getRawMany();

    // 직원별로 할당된 프로젝트 그룹화
    const employeeProjectsMap = new Map<string, string[]>();
    for (const assignment of projectAssignments) {
      const empId = assignment.assignment_employeeid;
      const projId = assignment.assignment_projectid;
      if (!employeeProjectsMap.has(empId)) {
        employeeProjectsMap.set(empId, []);
      }
      employeeProjectsMap.get(empId)!.push(projId);
    }

    // 3. 각 직원의 할당된 프로젝트별로 WBS 할당
    for (const employeeId of employeeIds) {
      // 이미 할당된 프로젝트만 사용
      const employeeProjects = employeeProjectsMap.get(employeeId) || [];

      if (employeeProjects.length === 0) {
        this.logger.warn(`직원 ${employeeId}에게 할당된 프로젝트가 없습니다.`);
        continue;
      }

      for (const projectId of employeeProjects) {
        // 해당 프로젝트에 속한 WBS만 필터링
        const projectWbsList = projectWbsMap.get(projectId) || [];

        if (projectWbsList.length === 0) {
          this.logger.warn(`프로젝트 ${projectId}에 속한 WBS가 없습니다.`);
          continue;
        }

        // 해당 프로젝트의 WBS 중 일부 선택
        const wbsCount = ProbabilityUtil.randomInt(
          2,
          Math.min(5, projectWbsList.length),
        );
        const selectedWbs = this.랜덤_선택(projectWbsList, wbsCount);

        for (let i = 0; i < selectedWbs.length; i++) {
          const assignment = new EvaluationWbsAssignment();
          assignment.periodId = periodId;
          assignment.employeeId = employeeId;
          assignment.projectId = projectId;
          assignment.wbsItemId = selectedWbs[i];
          assignment.assignedBy = assignerId;
          assignment.assignedDate = new Date();
          assignment.displayOrder = i;
          assignment.createdBy = systemAdminId;
          assignments.push(assignment);
        }
      }
    }

    return await this.배치로_저장한다(
      this.wbsAssignmentRepository,
      assignments,
      'WBS 할당',
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
