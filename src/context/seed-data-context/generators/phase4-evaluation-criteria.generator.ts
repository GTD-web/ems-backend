import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';

import { WbsEvaluationCriteria } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { EvaluatorType } from '@domain/core/evaluation-line/evaluation-line.types';
import { WbsAssignmentWeightCalculationService } from '@context/evaluation-criteria-management-context/services/wbs-assignment-weight-calculation.service';

import {
  SeedDataConfig,
  GeneratorResult,
  DEFAULT_STATE_DISTRIBUTION,
} from '../types';
import { ProbabilityUtil } from '../utils';

const BATCH_SIZE = 500;

@Injectable()
export class Phase4EvaluationCriteriaGenerator {
  private readonly logger = new Logger(Phase4EvaluationCriteriaGenerator.name);

  constructor(
    @InjectRepository(WbsEvaluationCriteria)
    private readonly wbsCriteriaRepository: Repository<WbsEvaluationCriteria>,
    @InjectRepository(EvaluationLine)
    private readonly evaluationLineRepository: Repository<EvaluationLine>,
    @InjectRepository(EvaluationLineMapping)
    private readonly evaluationLineMappingRepository: Repository<EvaluationLineMapping>,
    @InjectRepository(EvaluationWbsAssignment)
    private readonly wbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
    private readonly weightCalculationService: WbsAssignmentWeightCalculationService,
  ) {}

  async generate(
    config: SeedDataConfig,
    phase1Result: GeneratorResult,
    phase2Result: GeneratorResult,
    phase3Result: GeneratorResult,
  ): Promise<GeneratorResult> {
    const startTime = Date.now();
    const dist = {
      ...DEFAULT_STATE_DISTRIBUTION,
      ...config.stateDistribution,
    };

    this.logger.log('Phase 4: 평가 기준 및 라인 생성');

    const systemAdminId = phase1Result.generatedIds.systemAdminId as string;
    const wbsIds = phase1Result.generatedIds.wbsIds as string[];
    const employeeIds = phase1Result.generatedIds.employeeIds as string[];
    const periodIds = phase2Result.generatedIds.periodIds as string[];

    // Phase3에서 실제로 할당된 WBS만 평가기준 생성
    const assignedWbsIds = await this.실제_할당된_WBS_ID를_조회한다(
      periodIds[0],
    );

    this.logger.log(
      `실제 할당된 WBS: ${assignedWbsIds.length}개 (전체 WBS: ${wbsIds.length}개)`,
    );

    // 1. WBS 평가 기준 생성 (실제 할당된 WBS만)
    const criteria = await this.생성_WBS평가기준들(
      assignedWbsIds,
      dist,
      systemAdminId,
    );
    this.logger.log(`생성 완료: WbsEvaluationCriteria ${criteria.length}개`);

    // 2. 평가 라인 생성 (primary, secondary)
    const evaluationLines = await this.생성_평가라인들(systemAdminId);
    this.logger.log(`생성 완료: EvaluationLine ${evaluationLines.length}개`);

    // 3. 평가 라인 매핑 생성
    const lineMappings = await this.생성_평가라인매핑들(
      periodIds[0], // 평가기간 ID 전달
      employeeIds,
      evaluationLines,
      dist,
      systemAdminId,
      config.currentUserId,
    );
    this.logger.log(
      `생성 완료: EvaluationLineMapping ${lineMappings.length}개`,
    );

    // 4. WBS 할당 가중치 재계산 (WBS 평가 기준 생성 후)
    await this.WBS할당_가중치를_재계산한다(employeeIds, periodIds);

    const duration = Date.now() - startTime;
    this.logger.log(`Phase 4 완료 (${duration}ms)`);

    return {
      phase: 'Phase4',
      entityCounts: {
        WbsEvaluationCriteria: criteria.length,
        EvaluationLine: evaluationLines.length,
        EvaluationLineMapping: lineMappings.length,
      },
      generatedIds: {
        criteriaIds: criteria.map((c) => c.id),
        evaluationLineIds: evaluationLines.map((el) => el.id),
        lineMappingIds: lineMappings.map((lm) => lm.id),
      },
      duration,
    };
  }

  private async 생성_WBS평가기준들(
    wbsIds: string[],
    dist: typeof DEFAULT_STATE_DISTRIBUTION,
    systemAdminId: string,
  ): Promise<WbsEvaluationCriteria[]> {
    this.logger.log(`평가기준 생성 시작 - WBS 개수: ${wbsIds.length}`);

    const allCriteria: WbsEvaluationCriteria[] = [];

    for (const wbsId of wbsIds) {
      // WBS별로 하나의 평가기준만 생성 (기존 여러 개 생성 로직 제거)
      const criteria = new WbsEvaluationCriteria();
      criteria.wbsItemId = wbsId;
      criteria.criteria = faker.lorem.sentence();
      criteria.importance = faker.number.int({ min: 1, max: 10 });
      criteria.createdBy = systemAdminId;
      allCriteria.push(criteria);
    }

    this.logger.log(`평가기준 저장 전 - 생성된 개수: ${allCriteria.length}`);

    const saved = await this.배치로_저장한다(
      this.wbsCriteriaRepository,
      allCriteria,
      'WBS 평가기준',
    );

    this.logger.log(`평가기준 저장 완료 - 저장된 개수: ${saved.length}`);

    return saved;
  }

  private async 생성_평가라인들(
    systemAdminId: string,
  ): Promise<EvaluationLine[]> {
    const lines: EvaluationLine[] = [];

    // Primary 평가자 라인
    const primary = new EvaluationLine();
    primary.evaluatorType = EvaluatorType.PRIMARY;
    primary.order = 1;
    primary.isRequired = true;
    primary.isAutoAssigned = false;
    primary.createdBy = systemAdminId;
    lines.push(primary);

    // Secondary 평가자 라인
    const secondary = new EvaluationLine();
    secondary.evaluatorType = EvaluatorType.SECONDARY;
    secondary.order = 2;
    secondary.isRequired = false;
    secondary.isAutoAssigned = false;
    secondary.createdBy = systemAdminId;
    lines.push(secondary);

    return await this.evaluationLineRepository.save(lines);
  }

  private async 생성_평가라인매핑들(
    evaluationPeriodId: string,
    employeeIds: string[],
    evaluationLines: EvaluationLine[],
    dist: typeof DEFAULT_STATE_DISTRIBUTION,
    systemAdminId: string,
    currentUserId?: string,
  ): Promise<EvaluationLineMapping[]> {
    const mappings: EvaluationLineMapping[] = [];
    const primaryLine = evaluationLines.find(
      (el) => el.evaluatorType === EvaluatorType.PRIMARY,
    )!;
    const secondaryLine = evaluationLines.find(
      (el) => el.evaluatorType === EvaluatorType.SECONDARY,
    )!;

    // 부서별 직원 그룹화 (각 부서의 첫 번째 직원이 부서장 역할)
    const departmentMap = await this.부서별_직원_그룹화(employeeIds);

    // WBS 할당 조회 (평가기간별 필터링, wbsItemId를 매핑에 포함하기 위함)
    const wbsAssignments = await this.wbsAssignmentRepository.find({
      where: {
        periodId: evaluationPeriodId,
        deletedAt: null as any,
      },
    });

    this.logger.log(
      `WBS 할당 ${wbsAssignments.length}개에 대해 평가라인 매핑 생성`,
    );

    // 1. 직원별 1차 평가자 매핑 생성 (직원별 고정 담당자, wbsItemId는 null)
    const processedEmployees = new Set<string>();
    for (const assignment of wbsAssignments) {
      const employeeId = assignment.employeeId;

      // 이미 처리된 직원은 스킵 (1차 평가자는 직원별 고정이므로 한 번만 생성)
      if (processedEmployees.has(employeeId)) continue;

      // Primary 평가자 결정
      const primaryEvaluator = await this.일차평가자_선택(
        employeeId,
        employeeIds,
        departmentMap,
        currentUserId,
      );
      if (!primaryEvaluator) continue;

      const primaryMapping = new EvaluationLineMapping();
      primaryMapping.evaluationPeriodId = evaluationPeriodId;
      primaryMapping.employeeId = employeeId;
      primaryMapping.evaluatorId = primaryEvaluator;
      primaryMapping.wbsItemId = undefined; // 1차 평가자는 직원별 고정 담당자이므로 WBS와 무관
      primaryMapping.evaluationLineId = primaryLine.id;
      primaryMapping.createdBy = systemAdminId;
      mappings.push(primaryMapping);

      processedEmployees.add(employeeId);
    }

    // 2. WBS 할당별 2차 평가자 매핑 생성 (WBS별 평가자, wbsItemId 존재)
    for (const assignment of wbsAssignments) {
      const employeeId = assignment.employeeId;
      const wbsItemId = assignment.wbsItemId;

      // Primary 평가자 결정 (2차 평가자 선택 시 제외하기 위해)
      const primaryEvaluator = await this.일차평가자_선택(
        employeeId,
        employeeIds,
        departmentMap,
        currentUserId,
      );
      if (!primaryEvaluator) continue;

      // Secondary 평가자 매핑 (확률적)
      const mappingType = ProbabilityUtil.selectByProbability(
        dist.evaluationLineMappingTypes,
      );
      if (
        mappingType === 'primaryAndSecondary' ||
        mappingType === 'withAdditional'
      ) {
        const otherEmployees = employeeIds.filter(
          (id) => id !== employeeId && id !== primaryEvaluator,
        );
        if (otherEmployees.length > 0) {
          // 현재 사용자가 있고, 1차 평가자가 아닌 경우 우선적으로 선택
          let secondaryEvaluator: string;
          if (currentUserId && currentUserId !== primaryEvaluator && otherEmployees.includes(currentUserId)) {
            secondaryEvaluator = currentUserId;
            this.logger.log(`현재 사용자를 2차 평가자로 선택: ${currentUserId}`);
          } else {
            secondaryEvaluator = otherEmployees[Math.floor(Math.random() * otherEmployees.length)];
          }
          const secondaryMapping = new EvaluationLineMapping();
          secondaryMapping.evaluationPeriodId = evaluationPeriodId;
          secondaryMapping.employeeId = employeeId;
          secondaryMapping.evaluatorId = secondaryEvaluator;
          secondaryMapping.wbsItemId = wbsItemId; // 2차 평가자는 WBS별 평가자이므로 wbsItemId 필요
          secondaryMapping.evaluationLineId = secondaryLine.id;
          secondaryMapping.createdBy = systemAdminId;
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

  /**
   * 부서별로 직원을 그룹화한다
   * 각 부서의 첫 번째 직원이 부서장 역할을 한다
   */
  private async 부서별_직원_그룹화(
    employeeIds: string[],
  ): Promise<Map<string, string[]>> {
    const departmentMap = new Map<string, string[]>();

    // Employee 엔티티에서 부서 정보 조회
    const employees = await this.evaluationLineMappingRepository.manager
      .createQueryBuilder()
      .select(['employee.id', 'employee.departmentId'])
      .from('employee', 'employee')
      .where('employee.id IN (:...employeeIds)', { employeeIds })
      .andWhere('employee.deletedAt IS NULL')
      .orderBy('employee.createdAt', 'ASC') // 생성 순서대로 정렬 (첫 번째 = 부서장)
      .getRawMany();

    for (const emp of employees) {
      const deptId = emp.employee_departmentId || 'NO_DEPARTMENT';
      if (!departmentMap.has(deptId)) {
        departmentMap.set(deptId, []);
      }
      departmentMap.get(deptId)!.push(emp.employee_id);
    }

    return departmentMap;
  }

  /**
   * 1차 평가자를 선택한다
   * - 현재 사용자가 있으면 우선적으로 선택 (테스트용)
   * - 같은 부서의 첫 번째 직원(부서장)이 1차 평가자
   * - 부서장 본인은 다른 부서의 부서장이 평가
   * - 부서가 없는 경우 무작위 선택
   */
  private async 일차평가자_선택(
    employeeId: string,
    allEmployeeIds: string[],
    departmentMap: Map<string, string[]>,
    currentUserId?: string,
  ): Promise<string | null> {
    // 현재 사용자가 있고, 본인이 아닌 경우 우선적으로 선택
    if (currentUserId && currentUserId !== employeeId && allEmployeeIds.includes(currentUserId)) {
      this.logger.log(`현재 사용자를 1차 평가자로 선택: ${currentUserId}`);
      return currentUserId;
    }

    // 해당 직원이 속한 부서 찾기
    let employeeDepartment: string | null = null;
    let isDepartmentHead = false;

    for (const [deptId, empIds] of departmentMap.entries()) {
      if (empIds.includes(employeeId)) {
        employeeDepartment = deptId;
        // 부서의 첫 번째 직원이면 부서장
        isDepartmentHead = empIds[0] === employeeId;
        break;
      }
    }

    // 부서장이 아닌 경우: 같은 부서의 첫 번째 직원(부서장)이 평가
    if (!isDepartmentHead && employeeDepartment) {
      const deptEmployees = departmentMap.get(employeeDepartment);
      if (deptEmployees && deptEmployees.length > 0) {
        return deptEmployees[0]; // 부서의 첫 번째 직원(부서장)
      }
    }

    // 부서장인 경우: 다른 부서의 부서장 중 무작위 선택
    if (isDepartmentHead) {
      const otherDepartmentHeads: string[] = [];
      for (const [deptId, empIds] of departmentMap.entries()) {
        if (deptId !== employeeDepartment && empIds.length > 0) {
          otherDepartmentHeads.push(empIds[0]); // 각 부서의 첫 번째 직원(부서장)
        }
      }

      if (otherDepartmentHeads.length > 0) {
        return otherDepartmentHeads[
          Math.floor(Math.random() * otherDepartmentHeads.length)
        ];
      }
    }

    // 부서가 없거나 다른 부서장이 없는 경우: 무작위 선택
    const otherEmployees = allEmployeeIds.filter((id) => id !== employeeId);
    if (otherEmployees.length === 0) return null;

    return otherEmployees[Math.floor(Math.random() * otherEmployees.length)];
  }

  /**
   * WBS 할당 가중치를 재계산한다
   * - WBS 평가 기준 생성 후 모든 직원-평가기간 조합에 대해 가중치를 재계산한다
   */
  private async WBS할당_가중치를_재계산한다(
    employeeIds: string[],
    periodIds: string[],
  ): Promise<void> {
    this.logger.log(
      `WBS 할당 가중치 재계산 시작 - 직원: ${employeeIds.length}명, 평가기간: ${periodIds.length}개`,
    );

    let recalculatedCount = 0;
    let totalAssignments = 0;

    // 모든 직원-평가기간 조합에 대해 가중치 재계산
    for (const employeeId of employeeIds) {
      for (const periodId of periodIds) {
        // 해당 직원-평가기간에 WBS 할당이 있는지 확인
        const hasAssignment = await this.wbsAssignmentRepository
          .createQueryBuilder('assignment')
          .where('assignment.employeeId = :employeeId', { employeeId })
          .andWhere('assignment.periodId = :periodId', { periodId })
          .andWhere('assignment.deletedAt IS NULL')
          .getCount();

        if (hasAssignment > 0) {
          totalAssignments += hasAssignment;
          await this.weightCalculationService.직원_평가기간_가중치를_재계산한다(
            employeeId,
            periodId,
          );
          recalculatedCount++;
        }
      }
    }

    this.logger.log(
      `WBS 할당 가중치 재계산 완료 - ${recalculatedCount}개 직원-평가기간 조합, 총 ${totalAssignments}개 할당`,
    );

    // 재계산 결과 확인
    if (recalculatedCount > 0) {
      const sampleAssignment = await this.wbsAssignmentRepository
        .createQueryBuilder('assignment')
        .where('assignment.deletedAt IS NULL')
        .orderBy('assignment.createdAt', 'ASC')
        .limit(5)
        .getMany();

      this.logger.log(
        `샘플 WBS 할당 가중치: ${sampleAssignment.map((a) => `${a.weight}`).join(', ')}`,
      );
    }
  }

  /**
   * 실제 할당된 WBS ID를 조회한다
   */
  private async 실제_할당된_WBS_ID를_조회한다(
    periodId: string,
  ): Promise<string[]> {
    const assignments = await this.wbsAssignmentRepository
      .createQueryBuilder('assignment')
      .select('DISTINCT assignment.wbsItemId', 'wbsItemId')
      .where('assignment.periodId = :periodId', { periodId })
      .andWhere('assignment.deletedAt IS NULL')
      .getRawMany();

    return assignments.map((a) => a.wbsItemId);
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
