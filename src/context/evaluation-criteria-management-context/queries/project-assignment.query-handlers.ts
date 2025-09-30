import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { EvaluationProjectAssignmentService } from '../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.service';
import { EvaluationProjectAssignmentDto } from '../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.types';
import {
  GetProjectAssignmentListQuery,
  GetEmployeeProjectAssignmentsQuery,
  GetProjectAssignedEmployeesQuery,
  GetPeriodProjectAssignmentStatusQuery,
  GetProjectAssignmentDetailQuery,
  GetUnassignedEmployeesQuery,
  GetProjectAssignmentStatisticsQuery,
  ProjectAssignmentListResult,
  ProjectAssignmentStatusResult,
  ProjectAssignmentStatisticsResult,
} from './project-assignment.queries';

/**
 * 프로젝트 할당 목록 조회 쿼리 핸들러
 */
@QueryHandler(GetProjectAssignmentListQuery)
@Injectable()
export class GetProjectAssignmentListHandler
  implements IQueryHandler<GetProjectAssignmentListQuery>
{
  constructor(
    private readonly projectAssignmentService: EvaluationProjectAssignmentService,
  ) {}

  async execute(
    query: GetProjectAssignmentListQuery,
  ): Promise<ProjectAssignmentListResult> {
    const { filter } = query;
    const assignments =
      await this.projectAssignmentService.필터_조회한다(filter);

    // TODO: 실제 페이징 및 상세 정보 처리 필요
    return {
      assignments: assignments.map((a) => ({
        id: a.id,
        periodId: a.periodId,
        employeeId: a.employeeId,
        employeeName: '', // TODO: Employee 서비스에서 조회
        departmentName: '', // TODO: Department 서비스에서 조회
        projectId: a.projectId,
        projectName: '', // TODO: Project 서비스에서 조회
        assignedDate: a.assignedDate,
        assignedBy: a.assignedBy,
        assignedByName: '', // TODO: Employee 서비스에서 조회
      })),
      totalCount: assignments.length,
      page: 1,
      limit: assignments.length,
    };
  }
}

/**
 * 직원의 프로젝트 할당 조회 쿼리 핸들러
 */
@QueryHandler(GetEmployeeProjectAssignmentsQuery)
@Injectable()
export class GetEmployeeProjectAssignmentsHandler
  implements IQueryHandler<GetEmployeeProjectAssignmentsQuery>
{
  constructor(
    private readonly projectAssignmentService: EvaluationProjectAssignmentService,
  ) {}

  async execute(
    query: GetEmployeeProjectAssignmentsQuery,
  ): Promise<EvaluationProjectAssignmentDto[]> {
    const { employeeId, periodId } = query;
    const assignments =
      await this.projectAssignmentService.평가기간_직원별_조회한다(
        periodId,
        employeeId,
      );
    return assignments.map((a) => a.DTO로_변환한다());
  }
}

/**
 * 프로젝트별 할당된 직원 조회 쿼리 핸들러
 */
@QueryHandler(GetProjectAssignedEmployeesQuery)
@Injectable()
export class GetProjectAssignedEmployeesHandler
  implements IQueryHandler<GetProjectAssignedEmployeesQuery>
{
  constructor(
    private readonly projectAssignmentService: EvaluationProjectAssignmentService,
  ) {}

  async execute(
    query: GetProjectAssignedEmployeesQuery,
  ): Promise<EvaluationProjectAssignmentDto[]> {
    const { projectId, periodId } = query;
    const assignments = await this.projectAssignmentService.필터_조회한다({
      projectId,
      periodId,
    });
    return assignments.map((a) => a.DTO로_변환한다());
  }
}

/**
 * 평가기간별 프로젝트 할당 현황 조회 쿼리 핸들러
 */
@QueryHandler(GetPeriodProjectAssignmentStatusQuery)
@Injectable()
export class GetPeriodProjectAssignmentStatusHandler
  implements IQueryHandler<GetPeriodProjectAssignmentStatusQuery>
{
  constructor(
    private readonly projectAssignmentService: EvaluationProjectAssignmentService,
  ) {}

  async execute(
    query: GetPeriodProjectAssignmentStatusQuery,
  ): Promise<ProjectAssignmentStatusResult> {
    const { periodId } = query;
    const assignments =
      await this.projectAssignmentService.평가기간별_조회한다(periodId);
    const statistics = await this.projectAssignmentService.통계_조회한다({
      periodId,
    });

    // TODO: 실제 Employee 서비스에서 전체 직원 수 조회 필요
    const totalEmployees = 100; // 임시값
    const assignedEmployees = Object.keys(
      statistics.assignmentsByEmployee,
    ).length;

    return {
      periodId,
      totalEmployees,
      assignedEmployees,
      unassignedEmployees: totalEmployees - assignedEmployees,
      assignmentRate:
        totalEmployees > 0 ? (assignedEmployees / totalEmployees) * 100 : 0,
      projectStats: Object.entries(statistics.assignmentsByProject).map(
        ([projectId, count]) => ({
          projectId,
          projectName: '', // TODO: Project 서비스에서 조회
          assignedCount: count,
        }),
      ),
    };
  }
}

/**
 * 프로젝트 할당 상세 조회 쿼리 핸들러
 */
@QueryHandler(GetProjectAssignmentDetailQuery)
@Injectable()
export class GetProjectAssignmentDetailHandler
  implements IQueryHandler<GetProjectAssignmentDetailQuery>
{
  constructor(
    private readonly projectAssignmentService: EvaluationProjectAssignmentService,
  ) {}

  async execute(
    query: GetProjectAssignmentDetailQuery,
  ): Promise<EvaluationProjectAssignmentDto | null> {
    const { assignmentId } = query;
    const assignment =
      await this.projectAssignmentService.ID로_조회한다(assignmentId);
    return assignment ? assignment.DTO로_변환한다() : null;
  }
}

/**
 * 할당되지 않은 직원 목록 조회 쿼리 핸들러
 */
@QueryHandler(GetUnassignedEmployeesQuery)
@Injectable()
export class GetUnassignedEmployeesHandler
  implements IQueryHandler<GetUnassignedEmployeesQuery>
{
  constructor(
    private readonly projectAssignmentService: EvaluationProjectAssignmentService,
  ) {}

  async execute(query: GetUnassignedEmployeesQuery): Promise<string[]> {
    const { periodId, projectId } = query;
    const assignments =
      await this.projectAssignmentService.평가기간별_조회한다(periodId);
    const assignedEmployeeIds = assignments.map((a) => a.employeeId);

    // TODO: 실제 Employee 서비스에서 전체 직원 목록을 조회하고
    // 할당된 직원 ID를 제외해야 함
    return assignedEmployeeIds; // 임시로 할당된 직원 ID 반환
  }
}

/**
 * 프로젝트 할당 통계 조회 쿼리 핸들러
 */
@QueryHandler(GetProjectAssignmentStatisticsQuery)
@Injectable()
export class GetProjectAssignmentStatisticsHandler
  implements IQueryHandler<GetProjectAssignmentStatisticsQuery>
{
  constructor(
    private readonly projectAssignmentService: EvaluationProjectAssignmentService,
  ) {}

  async execute(
    query: GetProjectAssignmentStatisticsQuery,
  ): Promise<ProjectAssignmentStatisticsResult> {
    const { periodId, departmentId } = query;
    const statistics = await this.projectAssignmentService.통계_조회한다({
      periodId,
    });

    const uniqueEmployees = Object.keys(
      statistics.assignmentsByEmployee,
    ).length;
    const uniqueProjects = Object.keys(statistics.assignmentsByProject).length;

    return {
      periodId,
      departmentId,
      totalAssignments: statistics.totalAssignments,
      uniqueEmployees,
      uniqueProjects,
      averageProjectsPerEmployee:
        uniqueEmployees > 0 ? statistics.totalAssignments / uniqueEmployees : 0,
      averageEmployeesPerProject:
        uniqueProjects > 0 ? uniqueEmployees / uniqueProjects : 0,
      departmentBreakdown: [], // TODO: Department 정보를 위해 추가 서비스 필요
    };
  }
}
