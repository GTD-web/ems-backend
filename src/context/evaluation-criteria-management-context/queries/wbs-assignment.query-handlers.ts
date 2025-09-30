import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { EvaluationWbsAssignmentService } from '../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';
import type {
  EvaluationWbsAssignmentDto,
  EmployeeWbsAssignmentSummary,
  ProjectWbsAssignmentSummary,
} from '../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';
import {
  GetWbsAssignmentListQuery,
  GetEmployeeWbsAssignmentsQuery,
  GetProjectWbsAssignmentsQuery,
  GetWbsItemAssignmentsQuery,
  GetWbsAssignmentDetailQuery,
  GetPeriodWbsAssignmentStatusQuery,
  GetWbsAssignmentStatisticsQuery,
  GetUnassignedWbsItemsQuery,
  GetEmployeeWbsAssignmentSummaryQuery,
  GetProjectWbsAssignmentSummaryQuery,
  type WbsAssignmentListResult,
  type WbsAssignmentStatusResult,
  type WbsAssignmentStatisticsResult,
} from './wbs-assignment.queries';

/**
 * WBS 할당 목록 조회 핸들러
 */
@QueryHandler(GetWbsAssignmentListQuery)
@Injectable()
export class GetWbsAssignmentListHandler
  implements IQueryHandler<GetWbsAssignmentListQuery>
{
  constructor(
    private readonly wbsAssignmentService: EvaluationWbsAssignmentService,
  ) {}

  async execute(
    query: GetWbsAssignmentListQuery,
  ): Promise<WbsAssignmentListResult> {
    const { filter } = query;
    const assignments = await this.wbsAssignmentService.필터_조회한다(filter);

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
        wbsItemId: a.wbsItemId,
        wbsItemTitle: '', // TODO: WbsItem 서비스에서 조회
        wbsItemCode: '', // TODO: WbsItem 서비스에서 조회
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
 * 직원의 WBS 할당 조회 핸들러
 */
@QueryHandler(GetEmployeeWbsAssignmentsQuery)
@Injectable()
export class GetEmployeeWbsAssignmentsHandler
  implements IQueryHandler<GetEmployeeWbsAssignmentsQuery>
{
  constructor(
    private readonly wbsAssignmentService: EvaluationWbsAssignmentService,
  ) {}

  async execute(
    query: GetEmployeeWbsAssignmentsQuery,
  ): Promise<EvaluationWbsAssignmentDto[]> {
    const { employeeId, periodId } = query;
    const assignments =
      await this.wbsAssignmentService.평가기간_직원별_조회한다(
        periodId,
        employeeId,
      );
    return assignments.map((a) => a.DTO로_변환한다());
  }
}

/**
 * 프로젝트의 WBS 할당 조회 핸들러
 */
@QueryHandler(GetProjectWbsAssignmentsQuery)
@Injectable()
export class GetProjectWbsAssignmentsHandler
  implements IQueryHandler<GetProjectWbsAssignmentsQuery>
{
  constructor(
    private readonly wbsAssignmentService: EvaluationWbsAssignmentService,
  ) {}

  async execute(
    query: GetProjectWbsAssignmentsQuery,
  ): Promise<EvaluationWbsAssignmentDto[]> {
    const { projectId, periodId } = query;
    const assignments = await this.wbsAssignmentService.필터_조회한다({
      projectId,
      periodId,
    });
    return assignments.map((a) => a.DTO로_변환한다());
  }
}

/**
 * WBS 항목의 할당 조회 핸들러
 */
@QueryHandler(GetWbsItemAssignmentsQuery)
@Injectable()
export class GetWbsItemAssignmentsHandler
  implements IQueryHandler<GetWbsItemAssignmentsQuery>
{
  constructor(
    private readonly wbsAssignmentService: EvaluationWbsAssignmentService,
  ) {}

  async execute(
    query: GetWbsItemAssignmentsQuery,
  ): Promise<EvaluationWbsAssignmentDto[]> {
    const { wbsItemId, periodId } = query;
    const assignments = await this.wbsAssignmentService.필터_조회한다({
      wbsItemId,
      periodId,
    });
    return assignments.map((a) => a.DTO로_변환한다());
  }
}

/**
 * WBS 할당 상세 조회 핸들러
 */
@QueryHandler(GetWbsAssignmentDetailQuery)
@Injectable()
export class GetWbsAssignmentDetailHandler
  implements IQueryHandler<GetWbsAssignmentDetailQuery>
{
  constructor(
    private readonly wbsAssignmentService: EvaluationWbsAssignmentService,
  ) {}

  async execute(
    query: GetWbsAssignmentDetailQuery,
  ): Promise<EvaluationWbsAssignmentDto | null> {
    const { assignmentId } = query;
    const assignment =
      await this.wbsAssignmentService.ID로_조회한다(assignmentId);
    return assignment ? assignment.DTO로_변환한다() : null;
  }
}

/**
 * 평가기간별 WBS 할당 현황 조회 핸들러
 */
@QueryHandler(GetPeriodWbsAssignmentStatusQuery)
@Injectable()
export class GetPeriodWbsAssignmentStatusHandler
  implements IQueryHandler<GetPeriodWbsAssignmentStatusQuery>
{
  constructor(
    private readonly wbsAssignmentService: EvaluationWbsAssignmentService,
  ) {}

  async execute(
    query: GetPeriodWbsAssignmentStatusQuery,
  ): Promise<WbsAssignmentStatusResult> {
    const { periodId } = query;
    const assignments =
      await this.wbsAssignmentService.평가기간별_조회한다(periodId);
    const statistics = await this.wbsAssignmentService.통계_조회한다({
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
          totalWbsItems: 0, // TODO: WbsItem 서비스에서 조회
          assignedWbsItems: count,
          assignmentRate: 0, // TODO: 계산 로직 추가
        }),
      ),
      wbsStats: Object.entries(statistics.assignmentsByWbsItem || {}).map(
        ([wbsItemId, count]) => ({
          wbsItemId,
          wbsItemTitle: '', // TODO: WbsItem 서비스에서 조회
          wbsItemCode: '', // TODO: WbsItem 서비스에서 조회
          assignedCount: count,
        }),
      ),
    };
  }
}

/**
 * WBS 할당 통계 조회 핸들러
 */
@QueryHandler(GetWbsAssignmentStatisticsQuery)
@Injectable()
export class GetWbsAssignmentStatisticsHandler
  implements IQueryHandler<GetWbsAssignmentStatisticsQuery>
{
  constructor(
    private readonly wbsAssignmentService: EvaluationWbsAssignmentService,
  ) {}

  async execute(
    query: GetWbsAssignmentStatisticsQuery,
  ): Promise<WbsAssignmentStatisticsResult> {
    const { periodId, departmentId } = query;
    const statistics = await this.wbsAssignmentService.통계_조회한다({
      periodId,
    });

    const uniqueEmployees = Object.keys(
      statistics.assignmentsByEmployee,
    ).length;
    const uniqueProjects = Object.keys(statistics.assignmentsByProject).length;
    const uniqueWbsItems = Object.keys(
      statistics.assignmentsByWbsItem || {},
    ).length;

    return {
      periodId,
      departmentId,
      totalAssignments: statistics.totalAssignments,
      uniqueEmployees,
      uniqueProjects,
      uniqueWbsItems,
      averageWbsItemsPerEmployee:
        uniqueEmployees > 0 ? statistics.totalAssignments / uniqueEmployees : 0,
      averageEmployeesPerWbsItem:
        uniqueWbsItems > 0 ? uniqueEmployees / uniqueWbsItems : 0,
      departmentBreakdown: [], // TODO: Department 정보를 위해 추가 서비스 필요
    };
  }
}

/**
 * 할당되지 않은 WBS 항목 조회 핸들러
 */
@QueryHandler(GetUnassignedWbsItemsQuery)
@Injectable()
export class GetUnassignedWbsItemsHandler
  implements IQueryHandler<GetUnassignedWbsItemsQuery>
{
  constructor(
    private readonly wbsAssignmentService: EvaluationWbsAssignmentService,
  ) {}

  async execute(query: GetUnassignedWbsItemsQuery): Promise<string[]> {
    const { projectId, periodId, employeeId } = query;
    const assignments = await this.wbsAssignmentService.필터_조회한다({
      projectId,
      periodId,
      employeeId,
    });
    const assignedWbsItemIds = assignments.map((a) => a.wbsItemId);

    // TODO: 실제 WbsItem 서비스에서 프로젝트의 전체 WBS 항목 목록을 조회하고
    // 할당된 WBS 항목 ID를 제외해야 함
    return assignedWbsItemIds; // 임시로 할당된 WBS 항목 ID 반환
  }
}

/**
 * 직원의 WBS 할당 요약 조회 핸들러
 */
@QueryHandler(GetEmployeeWbsAssignmentSummaryQuery)
@Injectable()
export class GetEmployeeWbsAssignmentSummaryHandler
  implements IQueryHandler<GetEmployeeWbsAssignmentSummaryQuery>
{
  constructor(
    private readonly wbsAssignmentService: EvaluationWbsAssignmentService,
  ) {}

  async execute(
    query: GetEmployeeWbsAssignmentSummaryQuery,
  ): Promise<EmployeeWbsAssignmentSummary> {
    const { employeeId, periodId } = query;
    return await this.wbsAssignmentService.직원_WBS_할당_요약_조회한다(
      employeeId,
      periodId,
    );
  }
}

/**
 * 프로젝트의 WBS 할당 요약 조회 핸들러
 */
@QueryHandler(GetProjectWbsAssignmentSummaryQuery)
@Injectable()
export class GetProjectWbsAssignmentSummaryHandler
  implements IQueryHandler<GetProjectWbsAssignmentSummaryQuery>
{
  constructor(
    private readonly wbsAssignmentService: EvaluationWbsAssignmentService,
  ) {}

  async execute(
    query: GetProjectWbsAssignmentSummaryQuery,
  ): Promise<ProjectWbsAssignmentSummary> {
    const { projectId, periodId } = query;
    return await this.wbsAssignmentService.프로젝트_WBS_할당_요약_조회한다(
      projectId,
      periodId,
    );
  }
}
