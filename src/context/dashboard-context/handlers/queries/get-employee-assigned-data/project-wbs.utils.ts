import { Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { Project } from '@domain/common/project/project.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';
import { WbsEvaluationCriteria } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity';
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import {
  AssignedProjectWithWbs,
  AssignedWbsInfo,
  WbsEvaluationCriterion,
  WbsPerformance,
  WbsSelfEvaluationInfo,
  WbsDownwardEvaluationInfo,
} from './types';

const logger = new Logger('ProjectWbsUtils');

/**
 * 프로젝트별 할당 정보 조회 (WBS 목록 포함)
 *
 * EvaluationProjectAssignment를 통해 할당된 프로젝트를 조회하고,
 * 각 프로젝트에 속한 WBS 목록을 함께 조회합니다.
 */
export async function getProjectsWithWbs(
  evaluationPeriodId: string,
  employeeId: string,
  projectAssignmentRepository: Repository<EvaluationProjectAssignment>,
  wbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
  wbsItemRepository: Repository<WbsItem>,
  criteriaRepository: Repository<WbsEvaluationCriteria>,
  selfEvaluationRepository: Repository<WbsSelfEvaluation>,
  downwardEvaluationRepository: Repository<DownwardEvaluation>,
): Promise<AssignedProjectWithWbs[]> {
  // 1. 평가 프로젝트 할당 조회 (Project 엔티티와 PM 직원 정보 join)
  const projectAssignments = await projectAssignmentRepository
    .createQueryBuilder('assignment')
    .leftJoin(
      Project,
      'project',
      'project.id = assignment.projectId AND project.deletedAt IS NULL',
    )
    .leftJoin(
      Employee,
      'manager',
      'manager.id::text = project.managerId AND manager.deletedAt IS NULL',
    )
    .select([
      'assignment.id AS assignment_id',
      'assignment.projectId AS assignment_projectid',
      'assignment.assignedDate AS assignment_assigneddate',
      'assignment.displayOrder AS assignment_displayorder',
      'project.id AS project_id',
      'project.name AS project_name',
      'project.projectCode AS project_projectcode',
      'project.status AS project_status',
      'project.startDate AS project_startdate',
      'project.endDate AS project_enddate',
      'project.managerId AS project_managerid',
      'manager.id AS manager_id',
      'manager.name AS manager_name',
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
    const projectId = row.assignment_projectid || row.project_id;

    if (!projectId) {
      logger.warn('프로젝트 ID가 없는 할당 발견', { row });
      continue;
    }

    const wbsList = await getWbsListByProject(
      evaluationPeriodId,
      employeeId,
      projectId,
      wbsAssignmentRepository,
      wbsItemRepository,
      criteriaRepository,
      selfEvaluationRepository,
      downwardEvaluationRepository,
    );

    projectsWithWbs.push({
      projectId,
      projectName: row.project_name || '',
      projectCode: row.project_projectcode || '',
      assignedAt: row.assignment_assigneddate,
      projectManager:
        row.manager_id && row.manager_name
          ? {
              id: row.manager_id,
              name: row.manager_name,
            }
          : null,
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
export async function getWbsListByProject(
  evaluationPeriodId: string,
  employeeId: string,
  projectId: string,
  wbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
  wbsItemRepository: Repository<WbsItem>,
  criteriaRepository: Repository<WbsEvaluationCriteria>,
  selfEvaluationRepository: Repository<WbsSelfEvaluation>,
  downwardEvaluationRepository: Repository<DownwardEvaluation>,
): Promise<AssignedWbsInfo[]> {
  // 1. WBS 할당 조회 (WbsItem join)
  const wbsAssignments = await wbsAssignmentRepository
    .createQueryBuilder('assignment')
    .leftJoin(
      WbsItem,
      'wbsItem',
      'wbsItem.id = assignment.wbsItemId AND wbsItem.projectId = assignment.projectId AND wbsItem.deletedAt IS NULL',
    )
    .select([
      'assignment.id AS assignment_id',
      'assignment.wbsItemId AS assignment_wbsitemid',
      'assignment.projectId AS assignment_projectid',
      'assignment.assignedDate AS assignment_assigneddate',
      'assignment.displayOrder AS assignment_displayorder',
      'wbsItem.id AS wbsitem_id',
      'wbsItem.wbsCode AS wbsitem_wbscode',
      'wbsItem.title AS wbsitem_title',
      'wbsItem.projectId AS wbsitem_projectid',
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
    const wbsItemId = row.assignment_wbsitemid;

    // 평가기준 조회
    const criteria = await getWbsCriteriaByWbsId(
      wbsItemId,
      criteriaRepository,
    );

    // 성과 및 자기평가 조회
    const selfEvaluationData = await getWbsSelfEvaluationByWbsId(
      evaluationPeriodId,
      employeeId,
      wbsItemId,
      selfEvaluationRepository,
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
      downwardEvaluations = await getWbsDownwardEvaluationsByWbsId(
        evaluationPeriodId,
        employeeId,
        wbsItemId,
        downwardEvaluationRepository,
      );
    } else {
      logger.warn(`WbsItemId가 없는 WBS: ${wbsItemId}`);
    }

    wbsInfos.push({
      wbsId: wbsItemId,
      wbsName: row.wbsitem_title || '',
      wbsCode: row.wbsitem_wbscode || '',
      weight: 0, // weight 컬럼이 엔티티에 없으므로 기본값 0 사용
      assignedAt: row.assignment_assigneddate,
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
export async function getWbsCriteriaByWbsId(
  wbsItemId: string,
  criteriaRepository: Repository<WbsEvaluationCriteria>,
): Promise<WbsEvaluationCriterion[]> {
  const criteria = await criteriaRepository
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
export async function getWbsSelfEvaluationByWbsId(
  evaluationPeriodId: string,
  employeeId: string,
  wbsItemId: string,
  selfEvaluationRepository: Repository<WbsSelfEvaluation>,
): Promise<{
  performance: WbsPerformance | null;
  selfEvaluation: WbsSelfEvaluationInfo | null;
} | null> {
  const selfEvaluation = await selfEvaluationRepository
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
export async function getWbsDownwardEvaluationsByWbsId(
  evaluationPeriodId: string,
  employeeId: string,
  wbsId: string, // wbsId 사용 (하향평가는 WBS 단위)
  downwardEvaluationRepository: Repository<DownwardEvaluation>,
): Promise<{
  primary: WbsDownwardEvaluationInfo | null;
  secondary: WbsDownwardEvaluationInfo | null;
}> {
  // 하향평가 조회 (PRIMARY, SECONDARY 구분)
  const downwardEvaluations = await downwardEvaluationRepository
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

