import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Department } from '@domain/common/department/department.entity';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { Project } from '@domain/common/project/project.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';
import { WbsEvaluationCriteria } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { EvaluatorType } from '@domain/core/evaluation-line/evaluation-line.types';
import { DownwardEvaluationType } from '@domain/core/downward-evaluation/downward-evaluation.types';
import {
  가중치_기반_자기평가_점수를_계산한다,
  자기평가_등급을_조회한다,
} from './get-employee-evaluation-period-status/self-evaluation.utils';
import {
  가중치_기반_1차_하향평가_점수를_계산한다,
  가중치_기반_2차_하향평가_점수를_계산한다,
  하향평가_등급을_조회한다,
} from './get-employee-evaluation-period-status/downward-evaluation-score.utils';

/**
 * 사용자 할당 정보 조회 쿼리
 */
export class GetEmployeeAssignedDataQuery {
  constructor(
    public readonly evaluationPeriodId: string,
    public readonly employeeId: string,
  ) {}
}

/**
 * 할당된 프로젝트 정보 (WBS 목록 포함)
 */
export interface AssignedProjectWithWbs {
  projectId: string;
  projectName: string;
  projectCode: string;
  assignedAt: Date;
  wbsList: AssignedWbsInfo[];
}

/**
 * WBS 평가기준 정보
 */
export interface WbsEvaluationCriterion {
  criterionId: string;
  criteria: string;
  createdAt: Date;
}

/**
 * WBS 성과 정보
 */
export interface WbsPerformance {
  performanceResult?: string;
  isCompleted: boolean;
  completedAt?: Date;
}

/**
 * WBS 자기평가 정보
 */
export interface WbsSelfEvaluationInfo {
  selfEvaluationId?: string;
  evaluationContent?: string;
  score?: number;
  isCompleted: boolean;
  isEditable: boolean;
  submittedAt?: Date;
}

/**
 * WBS 하향평가 정보
 */
export interface WbsDownwardEvaluationInfo {
  downwardEvaluationId?: string;
  evaluatorId?: string;
  evaluatorName?: string;
  evaluationContent?: string;
  score?: number;
  isCompleted: boolean;
  isEditable: boolean;
  submittedAt?: Date;
}

/**
 * 할당된 WBS 정보 (평가기준, 성과, 자기평가 포함)
 */
export interface AssignedWbsInfo {
  wbsId: string;
  wbsName: string;
  wbsCode: string;
  weight: number;
  assignedAt: Date;
  criteria: WbsEvaluationCriterion[];
  performance?: WbsPerformance | null;
  selfEvaluation?: WbsSelfEvaluationInfo | null;
  primaryDownwardEvaluation?: WbsDownwardEvaluationInfo | null;
  secondaryDownwardEvaluation?: WbsDownwardEvaluationInfo | null;
}

/**
 * 평가기간 정보
 */
export interface EvaluationPeriodInfo {
  id: string;
  name: string;
  startDate: Date;
  endDate?: Date;
  status: string;
  description?: string;
  criteriaSettingEnabled: boolean;
  selfEvaluationSettingEnabled: boolean;
  finalEvaluationSettingEnabled: boolean;
  maxSelfEvaluationRate: number;
}

/**
 * 직원 정보
 */
export interface EmployeeInfo {
  id: string;
  employeeNumber: string;
  name: string;
  email: string;
  phoneNumber?: string;
  departmentId: string;
  departmentName?: string;
  status: string;
}

/**
 * 사용자 할당 정보 조회 결과
 */
export interface EmployeeAssignedDataResult {
  evaluationPeriod: EvaluationPeriodInfo;
  employee: EmployeeInfo;
  projects: AssignedProjectWithWbs[];
  summary: {
    totalProjects: number;
    totalWbs: number;
    completedPerformances: number;
    completedSelfEvaluations: number;
    selfEvaluation: {
      totalScore: number | null;
      grade: string | null;
    };
    primaryDownwardEvaluation: {
      totalScore: number | null;
      grade: string | null;
    };
    secondaryDownwardEvaluation: {
      totalScore: number | null;
      grade: string | null;
    };
  };
}

/**
 * 사용자 할당 정보 조회 쿼리 핸들러
 */
@Injectable()
@QueryHandler(GetEmployeeAssignedDataQuery)
export class GetEmployeeAssignedDataHandler
  implements
    IQueryHandler<GetEmployeeAssignedDataQuery, EmployeeAssignedDataResult>
{
  private readonly logger = new Logger(GetEmployeeAssignedDataHandler.name);

  constructor(
    @InjectRepository(EvaluationPeriod)
    private readonly evaluationPeriodRepository: Repository<EvaluationPeriod>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(EvaluationPeriodEmployeeMapping)
    private readonly mappingRepository: Repository<EvaluationPeriodEmployeeMapping>,
    @InjectRepository(EvaluationProjectAssignment)
    private readonly projectAssignmentRepository: Repository<EvaluationProjectAssignment>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(EvaluationWbsAssignment)
    private readonly wbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
    @InjectRepository(WbsItem)
    private readonly wbsItemRepository: Repository<WbsItem>,
    @InjectRepository(WbsEvaluationCriteria)
    private readonly criteriaRepository: Repository<WbsEvaluationCriteria>,
    @InjectRepository(WbsSelfEvaluation)
    private readonly selfEvaluationRepository: Repository<WbsSelfEvaluation>,
    @InjectRepository(DownwardEvaluation)
    private readonly downwardEvaluationRepository: Repository<DownwardEvaluation>,
    @InjectRepository(EvaluationLine)
    private readonly evaluationLineRepository: Repository<EvaluationLine>,
    @InjectRepository(EvaluationLineMapping)
    private readonly evaluationLineMappingRepository: Repository<EvaluationLineMapping>,
  ) {}

  async execute(
    query: GetEmployeeAssignedDataQuery,
  ): Promise<EmployeeAssignedDataResult> {
    const { evaluationPeriodId, employeeId } = query;

    this.logger.log('사용자 할당 정보 조회 시작', {
      evaluationPeriodId,
      employeeId,
    });

    // 1. 평가기간 조회
    const evaluationPeriod = await this.evaluationPeriodRepository.findOne({
      where: { id: evaluationPeriodId },
    });

    if (!evaluationPeriod) {
      throw new NotFoundException(
        `평가기간을 찾을 수 없습니다. (evaluationPeriodId: ${evaluationPeriodId})`,
      );
    }

    // 2. 직원 조회
    const employee = await this.employeeRepository.findOne({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException(
        `직원을 찾을 수 없습니다. (employeeId: ${employeeId})`,
      );
    }

    // 3. 부서명 조회
    let departmentName: string | undefined;
    if (employee.departmentId) {
      // departmentId가 UUID인지 확인하고 code로 조회 시도
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          employee.departmentId,
        );

      const department = await this.departmentRepository.findOne({
        where: isUUID
          ? { id: employee.departmentId }
          : { code: employee.departmentId },
      });
      departmentName = department?.name;
    }

    // 4. 평가기간-직원 매핑 확인
    const mapping = await this.mappingRepository.findOne({
      where: {
        evaluationPeriodId,
        employeeId,
      },
    });

    if (!mapping) {
      throw new NotFoundException(
        `평가기간에 등록되지 않은 직원입니다. (evaluationPeriodId: ${evaluationPeriodId}, employeeId: ${employeeId})`,
      );
    }

    // 5. 프로젝트별 할당 정보 조회 (WBS 포함)
    const projects = await this.getProjectsWithWbs(
      evaluationPeriodId,
      employeeId,
    );

    // 6. 요약 정보 계산
    let completedPerformances = 0;
    let completedSelfEvaluations = 0;
    const totalWbs = projects.reduce((sum, project) => {
      project.wbsList.forEach((wbs) => {
        if (wbs.performance?.isCompleted) completedPerformances++;
        if (wbs.selfEvaluation?.isCompleted) completedSelfEvaluations++;
      });
      return sum + project.wbsList.length;
    }, 0);

    // 7. 자기평가 점수/등급 계산
    let selfEvaluationScore: number | null = null;
    let selfEvaluationGrade: string | null = null;

    const totalSelfEvaluations = await this.selfEvaluationRepository.count({
      where: {
        periodId: evaluationPeriodId,
        employeeId: employeeId,
        deletedAt: null as any,
      },
    });

    if (
      totalSelfEvaluations > 0 &&
      completedSelfEvaluations === totalSelfEvaluations
    ) {
      selfEvaluationScore = await 가중치_기반_자기평가_점수를_계산한다(
        evaluationPeriodId,
        employeeId,
        this.selfEvaluationRepository,
        this.wbsAssignmentRepository,
        this.evaluationPeriodRepository,
      );

      if (selfEvaluationScore !== null) {
        selfEvaluationGrade = await 자기평가_등급을_조회한다(
          evaluationPeriodId,
          selfEvaluationScore,
          this.evaluationPeriodRepository,
        );
      }
    }

    // 8. 1차 하향평가 점수/등급 계산
    let primaryDownwardScore: number | null = null;
    let primaryDownwardGrade: string | null = null;

    // 1차 평가자 조회
    const primaryEvaluatorMapping = await this.evaluationLineMappingRepository
      .createQueryBuilder('mapping')
      .leftJoin(
        EvaluationLine,
        'line',
        'line.id = mapping.evaluationLineId AND line.deletedAt IS NULL',
      )
      .where('mapping.employeeId = :employeeId', { employeeId })
      .andWhere('line.evaluatorType = :evaluatorType', {
        evaluatorType: EvaluatorType.PRIMARY,
      })
      .andWhere('mapping.deletedAt IS NULL')
      .getOne();

    if (primaryEvaluatorMapping) {
      const primaryEvaluatorId = primaryEvaluatorMapping.evaluatorId;

      // 1차 평가자의 할당된 WBS 수 조회
      const primaryAssignedCount = totalWbs;

      // 1차 평가자의 완료된 평가 수 조회
      const primaryCompletedCount =
        await this.downwardEvaluationRepository.count({
          where: {
            periodId: evaluationPeriodId,
            employeeId: employeeId,
            evaluatorId: primaryEvaluatorId,
            evaluationType: DownwardEvaluationType.PRIMARY,
            isCompleted: true,
            deletedAt: null as any,
          },
        });

      // 모든 WBS가 완료되면 점수/등급 계산
      if (
        primaryAssignedCount > 0 &&
        primaryCompletedCount === primaryAssignedCount
      ) {
        primaryDownwardScore = await 가중치_기반_1차_하향평가_점수를_계산한다(
          evaluationPeriodId,
          employeeId,
          primaryEvaluatorId,
          this.downwardEvaluationRepository,
          this.wbsAssignmentRepository,
        );

        if (primaryDownwardScore !== null) {
          primaryDownwardGrade = await 하향평가_등급을_조회한다(
            evaluationPeriodId,
            primaryDownwardScore,
            this.evaluationPeriodRepository,
          );
        }
      }
    }

    // 9. 2차 하향평가 점수/등급 계산
    let secondaryDownwardScore: number | null = null;
    let secondaryDownwardGrade: string | null = null;

    // 2차 평가자들 조회
    const secondaryEvaluatorMappings =
      await this.evaluationLineMappingRepository
        .createQueryBuilder('mapping')
        .leftJoin(
          EvaluationLine,
          'line',
          'line.id = mapping.evaluationLineId AND line.deletedAt IS NULL',
        )
        .where('mapping.employeeId = :employeeId', { employeeId })
        .andWhere('line.evaluatorType = :evaluatorType', {
          evaluatorType: EvaluatorType.SECONDARY,
        })
        .andWhere('mapping.deletedAt IS NULL')
        .getMany();

    if (secondaryEvaluatorMappings.length > 0) {
      const secondaryEvaluatorIds = secondaryEvaluatorMappings.map(
        (m) => m.evaluatorId,
      );

      // 2차 평가자들의 할당된 WBS 수 (모든 평가자가 동일한 WBS 평가)
      const secondaryAssignedCount = totalWbs;

      // 각 평가자별 완료된 평가 수 조회
      const completedCounts = await Promise.all(
        secondaryEvaluatorIds.map((evaluatorId) =>
          this.downwardEvaluationRepository.count({
            where: {
              periodId: evaluationPeriodId,
              employeeId: employeeId,
              evaluatorId: evaluatorId,
              evaluationType: DownwardEvaluationType.SECONDARY,
              isCompleted: true,
              deletedAt: null as any,
            },
          }),
        ),
      );

      // 모든 평가자가 모든 WBS를 완료했는지 확인
      const allCompleted = completedCounts.every(
        (count) => count === secondaryAssignedCount,
      );

      if (secondaryAssignedCount > 0 && allCompleted) {
        secondaryDownwardScore = await 가중치_기반_2차_하향평가_점수를_계산한다(
          evaluationPeriodId,
          employeeId,
          secondaryEvaluatorIds,
          this.downwardEvaluationRepository,
          this.wbsAssignmentRepository,
        );

        if (secondaryDownwardScore !== null) {
          secondaryDownwardGrade = await 하향평가_등급을_조회한다(
            evaluationPeriodId,
            secondaryDownwardScore,
            this.evaluationPeriodRepository,
          );
        }
      }
    }

    const summary = {
      totalProjects: projects.length,
      totalWbs,
      completedPerformances,
      completedSelfEvaluations,
      selfEvaluation: {
        totalScore: selfEvaluationScore,
        grade: selfEvaluationGrade,
      },
      primaryDownwardEvaluation: {
        totalScore: primaryDownwardScore,
        grade: primaryDownwardGrade,
      },
      secondaryDownwardEvaluation: {
        totalScore: secondaryDownwardScore,
        grade: secondaryDownwardGrade,
      },
    };

    return {
      evaluationPeriod: {
        id: evaluationPeriod.id,
        name: evaluationPeriod.name,
        startDate: evaluationPeriod.startDate,
        endDate: evaluationPeriod.endDate,
        status: evaluationPeriod.status,
        description: evaluationPeriod.description,
        criteriaSettingEnabled: evaluationPeriod.criteriaSettingEnabled,
        selfEvaluationSettingEnabled:
          evaluationPeriod.selfEvaluationSettingEnabled,
        finalEvaluationSettingEnabled:
          evaluationPeriod.finalEvaluationSettingEnabled,
        maxSelfEvaluationRate: evaluationPeriod.maxSelfEvaluationRate,
      },
      employee: {
        id: employee.id,
        employeeNumber: employee.employeeNumber,
        name: employee.name,
        email: employee.email,
        phoneNumber: employee.phoneNumber,
        departmentId: employee.departmentId || '',
        departmentName,
        status: employee.status,
      },
      projects,
      summary,
    };
  }

  /**
   * 프로젝트별 할당 정보 조회 (WBS 목록 포함)
   *
   * EvaluationProjectAssignment를 통해 할당된 프로젝트를 조회하고,
   * 각 프로젝트에 속한 WBS 목록을 함께 조회합니다.
   */
  private async getProjectsWithWbs(
    evaluationPeriodId: string,
    employeeId: string,
  ): Promise<AssignedProjectWithWbs[]> {
    // 1. 평가 프로젝트 할당 조회 (Project 엔티티 join)
    const projectAssignments = await this.projectAssignmentRepository
      .createQueryBuilder('assignment')
      .leftJoin(
        Project,
        'project',
        'project.id = assignment.projectId AND project.deletedAt IS NULL',
      )
      .select([
        'assignment.id AS assignment_id',
        'assignment.projectId AS assignment_projectid',
        'assignment.assignedDate AS assignment_assigneddate',
        'assignment.displayOrder AS assignment_displayorder',
        'project.id AS project_id',
        'project.name AS project_name',
        'project.projectCode AS project_projectcode', // 소문자로 변경
        'project.status AS project_status',
        'project.startDate AS project_startdate',
        'project.endDate AS project_enddate',
      ])
      .where('assignment.periodId = :periodId', {
        periodId: evaluationPeriodId,
      })
      .andWhere('assignment.employeeId = :employeeId', { employeeId })
      .andWhere('assignment.deletedAt IS NULL')
      .orderBy('assignment.displayOrder', 'ASC')
      .addOrderBy('assignment.assignedDate', 'DESC')
      .getRawMany();

    // 2. 각 프로젝트에 속한 WBS 목록 조회
    const projectsWithWbs: AssignedProjectWithWbs[] = [];

    for (const row of projectAssignments) {
      const projectId = row.assignment_projectid || row.project_id; // 소문자로 수정

      if (!projectId) {
        this.logger.warn('프로젝트 ID가 없는 할당 발견', { row });
        continue;
      }

      const wbsList = await this.getWbsListByProject(
        evaluationPeriodId,
        employeeId,
        projectId,
      );

      projectsWithWbs.push({
        projectId,
        projectName: row.project_name || '',
        projectCode: row.project_projectcode || '', // 소문자로 수정
        assignedAt: row.assignment_assigneddate, // 소문자로 수정
        wbsList,
      });
    }

    return projectsWithWbs;
  }

  /**
   * 특정 프로젝트에 속한 WBS 목록 조회 (평가기준, 성과, 자기평가 포함)
   *
   * EvaluationWbsAssignment를 통해 특정 프로젝트의 WBS를 조회하고,
   * 각 WBS의 평가기준, 성과, 자기평가 정보를 함께 조회합니다.
   */
  private async getWbsListByProject(
    evaluationPeriodId: string,
    employeeId: string,
    projectId: string,
  ): Promise<AssignedWbsInfo[]> {
    // 디버깅: 먼저 assignment만 조회
    const assignmentsOnly = await this.wbsAssignmentRepository
      .createQueryBuilder('assignment')
      .select(['assignment.id', 'assignment.wbsItemId', 'assignment.projectId'])
      .where('assignment.periodId = :periodId', {
        periodId: evaluationPeriodId,
      })
      .andWhere('assignment.employeeId = :employeeId', { employeeId })
      .andWhere('assignment.projectId = :projectId', { projectId })
      .andWhere('assignment.deletedAt IS NULL')
      .getMany();

    // 1. WBS 할당 조회 (WbsItem join)
    const wbsAssignments = await this.wbsAssignmentRepository
      .createQueryBuilder('assignment')
      .leftJoin(
        WbsItem,
        'wbsItem',
        'wbsItem.id = assignment.wbsItemId AND wbsItem.projectId = assignment.projectId AND wbsItem.deletedAt IS NULL',
      )
      .select([
        'assignment.id AS assignment_id',
        'assignment.wbsItemId AS assignment_wbsitemid', // 소문자로 변경
        'assignment.projectId AS assignment_projectid', // 소문자로 변경
        'assignment.assignedDate AS assignment_assigneddate', // 소문자로 변경
        'assignment.displayOrder AS assignment_displayorder', // 소문자로 변경
        'wbsItem.id AS wbsitem_id', // 소문자로 변경
        'wbsItem.wbsCode AS wbsitem_wbscode', // 소문자로 변경
        'wbsItem.title AS wbsitem_title', // 소문자로 변경
        'wbsItem.projectId AS wbsitem_projectid', // 소문자로 변경
      ])
      .where('assignment.periodId = :periodId', {
        periodId: evaluationPeriodId,
      })
      .andWhere('assignment.employeeId = :employeeId', { employeeId })
      .andWhere('assignment.projectId = :projectId', { projectId })
      .andWhere('assignment.deletedAt IS NULL')
      .orderBy('assignment.displayOrder', 'ASC')
      .addOrderBy('assignment.assignedDate', 'DESC')
      .getRawMany();

    // 2. 각 WBS의 평가기준, 성과, 자기평가 조회
    const wbsInfos: AssignedWbsInfo[] = [];

    for (const row of wbsAssignments) {
      const wbsItemId = row.assignment_wbsitemid; // 소문자로 수정

      // 평가기준 조회
      const criteria = await this.getWbsCriteriaByWbsId(wbsItemId);

      // 성과 및 자기평가 조회
      const selfEvaluationData = await this.getWbsSelfEvaluationByWbsId(
        evaluationPeriodId,
        employeeId,
        wbsItemId,
      );

      // 하향평가 조회 (1차, 2차) - WBS 단위
      let downwardEvaluations: {
        primary: WbsDownwardEvaluationInfo | null;
        secondary: WbsDownwardEvaluationInfo | null;
      } = {
        primary: null,
        secondary: null,
      };

      if (wbsItemId) {
        downwardEvaluations = await this.getWbsDownwardEvaluationsByWbsId(
          evaluationPeriodId,
          employeeId,
          wbsItemId,
        );
      } else {
        this.logger.warn(`WbsItemId가 없는 WBS: ${wbsItemId}`);
      }

      wbsInfos.push({
        wbsId: wbsItemId,
        wbsName: row.wbsitem_title || '', // 소문자로 수정
        wbsCode: row.wbsitem_wbscode || '', // 소문자로 수정
        weight: 0, // weight 컬럼이 엔티티에 없으므로 기본값 0 사용
        assignedAt: row.assignment_assigneddate, // 소문자로 수정
        criteria,
        performance: selfEvaluationData?.performance || null,
        selfEvaluation: selfEvaluationData?.selfEvaluation || null,
        primaryDownwardEvaluation: downwardEvaluations.primary || null,
        secondaryDownwardEvaluation: downwardEvaluations.secondary || null,
      });
    }

    return wbsInfos;
  }

  /**
   * 특정 WBS의 평가기준 목록 조회
   *
   * WbsEvaluationCriteria를 조회합니다.
   */
  private async getWbsCriteriaByWbsId(
    wbsItemId: string,
  ): Promise<WbsEvaluationCriterion[]> {
    const criteria = await this.criteriaRepository
      .createQueryBuilder('criteria')
      .select([
        'criteria.id AS criteria_id',
        'criteria.criteria AS criteria_criteria',
        'criteria.createdAt AS criteria_createdAt',
      ])
      .where('criteria.wbsItemId = :wbsItemId', { wbsItemId })
      .andWhere('criteria.deletedAt IS NULL')
      .orderBy('criteria.createdAt', 'ASC')
      .getRawMany();

    return criteria.map((row) => ({
      criterionId: row.criteria_id,
      criteria: row.criteria_criteria || '',
      createdAt: row.criteria_createdAt,
    }));
  }

  /**
   * 특정 WBS의 성과 및 자기평가 조회
   *
   * WbsSelfEvaluation 엔티티에서 성과(performanceResult)와
   * 자기평가(selfEvaluationContent, selfEvaluationScore) 정보를 조회합니다.
   */
  private async getWbsSelfEvaluationByWbsId(
    evaluationPeriodId: string,
    employeeId: string,
    wbsItemId: string,
  ): Promise<{
    performance: WbsPerformance | null;
    selfEvaluation: WbsSelfEvaluationInfo | null;
  } | null> {
    const selfEvaluation = await this.selfEvaluationRepository
      .createQueryBuilder('evaluation')
      .select([
        '"evaluation"."id" AS "evaluation_id"',
        '"evaluation"."performanceResult" AS "evaluation_performanceResult"',
        '"evaluation"."selfEvaluationContent" AS "evaluation_selfEvaluationContent"',
        '"evaluation"."selfEvaluationScore" AS "evaluation_selfEvaluationScore"',
        '"evaluation"."isCompleted" AS "evaluation_isCompleted"',
        '"evaluation"."completedAt" AS "evaluation_completedAt"',
      ])
      .where('"evaluation"."periodId" = :periodId', {
        periodId: evaluationPeriodId,
      })
      .andWhere('"evaluation"."employeeId" = :employeeId', { employeeId })
      .andWhere('"evaluation"."wbsItemId" = :wbsItemId', { wbsItemId })
      .andWhere('"evaluation"."deletedAt" IS NULL')
      .getRawOne();

    if (!selfEvaluation) {
      return null;
    }

    // 성과 정보
    const performance: WbsPerformance = {
      performanceResult: selfEvaluation.evaluation_performanceResult,
      isCompleted: selfEvaluation.evaluation_isCompleted,
      completedAt: selfEvaluation.evaluation_completedAt,
    };

    // 자기평가 정보
    const evaluation: WbsSelfEvaluationInfo = {
      selfEvaluationId: selfEvaluation.evaluation_id,
      evaluationContent: selfEvaluation.evaluation_selfEvaluationContent,
      score: selfEvaluation.evaluation_selfEvaluationScore,
      isCompleted: selfEvaluation.evaluation_isCompleted,
      isEditable: true, // WbsSelfEvaluation 엔티티에 isEditable 필드가 없으므로 기본값
      submittedAt: selfEvaluation.evaluation_completedAt,
    };

    return {
      performance,
      selfEvaluation: evaluation,
    };
  }

  /**
   * 특정 WBS의 하향평가 조회 (1차, 2차)
   *
   * DownwardEvaluation 엔티티에서 PRIMARY와 SECONDARY 평가자의 하향평가 정보를 조회합니다.
   */
  private async getWbsDownwardEvaluationsByWbsId(
    evaluationPeriodId: string,
    employeeId: string,
    wbsId: string, // wbsId 사용 (하향평가는 WBS 단위)
  ): Promise<{
    primary: WbsDownwardEvaluationInfo | null;
    secondary: WbsDownwardEvaluationInfo | null;
  }> {
    // 하향평가 조회 (PRIMARY, SECONDARY 구분)
    const downwardEvaluations = await this.downwardEvaluationRepository
      .createQueryBuilder('downward')
      .select([
        '"downward"."id" AS downward_id',
        '"downward"."evaluatorId" AS downward_evaluatorId',
        '"downward"."evaluationType" AS downward_evaluatorType',
        '"downward"."downwardEvaluationContent" AS downward_evaluationContent',
        '"downward"."downwardEvaluationScore" AS downward_score',
        '"downward"."isCompleted" AS downward_isCompleted',
        '"downward"."completedAt" AS downward_completedAt',
        '"evaluator"."name" AS evaluator_name',
      ])
      .leftJoin(
        Employee,
        'evaluator',
        '"evaluator"."id" = "downward"."evaluatorId" AND "evaluator"."deletedAt" IS NULL',
      )
      .where('"downward"."periodId" = :evaluationPeriodId', {
        evaluationPeriodId,
      })
      .andWhere('"downward"."employeeId" = :employeeId', {
        employeeId: employeeId,
      })
      .andWhere('"downward"."wbsId" = :wbsId', { wbsId })
      .andWhere('"downward"."deletedAt" IS NULL')
      .getRawMany();

    let primary: WbsDownwardEvaluationInfo | null = null;
    let secondary: WbsDownwardEvaluationInfo | null = null;

    for (const row of downwardEvaluations) {
      const evaluationInfo: WbsDownwardEvaluationInfo = {
        downwardEvaluationId: row.downward_id,
        evaluatorId: row.downward_evaluatorId,
        evaluatorName: row.evaluator_name,
        evaluationContent: row.downward_evaluationContent,
        score: row.downward_score,
        isCompleted: row.downward_isCompleted === true,
        isEditable: row.downward_isCompleted !== true,
        submittedAt: row.downward_completedAt,
      };

      if (row.downward_evaluatorType === 'primary') {
        primary = evaluationInfo;
      } else if (row.downward_evaluatorType === 'secondary') {
        secondary = evaluationInfo;
      }
    }

    return {
      primary,
      secondary,
    };
  }
}
