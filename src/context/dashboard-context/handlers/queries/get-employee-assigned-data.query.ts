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
 * 할당된 WBS 정보 (평가기준, 성과, 자기평가 포함)
 */
export interface AssignedWbsInfo {
  wbsId: string;
  wbsName: string;
  wbsCode: string;
  projectId: string;
  projectName: string;
  weight: number;
  assignedAt: Date;
  criteria: WbsEvaluationCriterion[];
  performance?: WbsPerformance | null;
  selfEvaluation?: WbsSelfEvaluationInfo | null;
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
      const department = await this.departmentRepository.findOne({
        where: { id: employee.departmentId },
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

    const summary = {
      totalProjects: projects.length,
      totalWbs,
      completedPerformances,
      completedSelfEvaluations,
    };

    this.logger.log('사용자 할당 정보 조회 완료', {
      employeeId,
      summary,
    });

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
        'assignment.projectId AS assignment_projectId',
        'assignment.assignedDate AS assignment_assignedDate',
        'assignment.displayOrder AS assignment_displayOrder',
        'project.id AS project_id',
        'project.name AS project_name',
        'project.projectCode AS project_projectCode',
        'project.status AS project_status',
        'project.startDate AS project_startDate',
        'project.endDate AS project_endDate',
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
      const wbsList = await this.getWbsListByProject(
        evaluationPeriodId,
        employeeId,
        row.assignment_projectId,
      );

      projectsWithWbs.push({
        projectId: row.assignment_projectId,
        projectName: row.project_name || '',
        projectCode: row.project_projectCode || '',
        assignedAt: row.assignment_assignedDate,
        wbsList,
      });
    }

    this.logger.debug('프로젝트별 할당 정보 조회 완료', {
      employeeId,
      projectCount: projectsWithWbs.length,
      totalWbs: projectsWithWbs.reduce((sum, p) => sum + p.wbsList.length, 0),
    });

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
    // 1. WBS 할당 조회 (WbsItem join)
    const wbsAssignments = await this.wbsAssignmentRepository
      .createQueryBuilder('assignment')
      .leftJoin(
        WbsItem,
        'wbsItem',
        'wbsItem.id = assignment.wbsItemId AND wbsItem.deletedAt IS NULL',
      )
      .select([
        'assignment.id AS assignment_id',
        'assignment.wbsItemId AS assignment_wbsItemId',
        'assignment.projectId AS assignment_projectId',
        'assignment.weight AS assignment_weight',
        'assignment.assignedDate AS assignment_assignedDate',
        'assignment.displayOrder AS assignment_displayOrder',
        'wbsItem.id AS wbsItem_id',
        'wbsItem.wbsCode AS wbsItem_wbsCode',
        'wbsItem.title AS wbsItem_title',
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
      const wbsItemId = row.assignment_wbsItemId;

      // 평가기준 조회
      const criteria = await this.getWbsCriteriaByWbsId(wbsItemId);

      // 성과 및 자기평가 조회
      const selfEvaluationData = await this.getWbsSelfEvaluationByWbsId(
        evaluationPeriodId,
        employeeId,
        wbsItemId,
      );

      wbsInfos.push({
        wbsId: wbsItemId,
        wbsName: row.wbsItem_title || '',
        wbsCode: row.wbsItem_wbsCode || '',
        projectId,
        projectName: '', // 프로젝트명은 이미 상위에서 제공됨
        weight: parseFloat(row.assignment_weight) || 0,
        assignedAt: row.assignment_assignedDate,
        criteria,
        performance: selfEvaluationData?.performance || null,
        selfEvaluation: selfEvaluationData?.selfEvaluation || null,
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
        'evaluation.id AS evaluation_id',
        'evaluation.performanceResult AS evaluation_performanceResult',
        'evaluation.selfEvaluationContent AS evaluation_selfEvaluationContent',
        'evaluation.selfEvaluationScore AS evaluation_selfEvaluationScore',
        'evaluation.isCompleted AS evaluation_isCompleted',
        'evaluation.completedAt AS evaluation_completedAt',
      ])
      .where('evaluation.periodId = :periodId', {
        periodId: evaluationPeriodId,
      })
      .andWhere('evaluation.employeeId = :employeeId', { employeeId })
      .andWhere('evaluation.wbsItemId = :wbsItemId', { wbsItemId })
      .andWhere('evaluation.deletedAt IS NULL')
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
}
