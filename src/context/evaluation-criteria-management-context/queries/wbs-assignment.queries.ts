import type {
  EvaluationWbsAssignmentFilter,
  EvaluationWbsAssignmentDto,
  EmployeeWbsAssignmentSummary,
  ProjectWbsAssignmentSummary,
  EvaluationWbsAssignmentStatistics,
} from '../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';

/**
 * WBS 할당 목록 조회 쿼리
 */
export class GetWbsAssignmentListQuery {
  constructor(public readonly filter: EvaluationWbsAssignmentFilter) {}
}

/**
 * 직원의 WBS 할당 조회 쿼리
 */
export class GetEmployeeWbsAssignmentsQuery {
  constructor(
    public readonly employeeId: string,
    public readonly periodId: string,
  ) {}
}

/**
 * 프로젝트의 WBS 할당 조회 쿼리
 */
export class GetProjectWbsAssignmentsQuery {
  constructor(
    public readonly projectId: string,
    public readonly periodId: string,
  ) {}
}

/**
 * WBS 항목의 할당 조회 쿼리
 */
export class GetWbsItemAssignmentsQuery {
  constructor(
    public readonly wbsItemId: string,
    public readonly periodId: string,
  ) {}
}

/**
 * WBS 할당 상세 조회 쿼리
 */
export class GetWbsAssignmentDetailQuery {
  constructor(public readonly assignmentId: string) {}
}

/**
 * 평가기간별 WBS 할당 현황 조회 쿼리
 */
export class GetPeriodWbsAssignmentStatusQuery {
  constructor(public readonly periodId: string) {}
}

/**
 * WBS 할당 통계 조회 쿼리
 */
export class GetWbsAssignmentStatisticsQuery {
  constructor(
    public readonly periodId: string,
    public readonly departmentId?: string,
  ) {}
}

/**
 * 할당되지 않은 WBS 항목 조회 쿼리
 */
export class GetUnassignedWbsItemsQuery {
  constructor(
    public readonly projectId: string,
    public readonly periodId: string,
    public readonly employeeId?: string,
  ) {}
}

/**
 * 직원의 WBS 할당 요약 조회 쿼리
 */
export class GetEmployeeWbsAssignmentSummaryQuery {
  constructor(
    public readonly employeeId: string,
    public readonly periodId: string,
  ) {}
}

/**
 * 프로젝트의 WBS 할당 요약 조회 쿼리
 */
export class GetProjectWbsAssignmentSummaryQuery {
  constructor(
    public readonly projectId: string,
    public readonly periodId: string,
  ) {}
}

// ============================================================================
// 쿼리 결과 타입들
// ============================================================================

/**
 * WBS 할당 목록 결과
 */
export interface WbsAssignmentListResult {
  assignments: WbsAssignmentListItem[];
  totalCount: number;
  page: number;
  limit: number;
}

/**
 * WBS 할당 목록 항목
 */
export interface WbsAssignmentListItem {
  id: string;
  periodId: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  projectId: string;
  projectName: string;
  wbsItemId: string;
  wbsItemTitle: string;
  wbsItemCode: string;
  assignedDate: Date;
  assignedBy: string;
  assignedByName: string;
}

/**
 * WBS 할당 현황 결과
 */
export interface WbsAssignmentStatusResult {
  periodId: string;
  totalEmployees: number;
  assignedEmployees: number;
  unassignedEmployees: number;
  assignmentRate: number;
  projectStats: {
    projectId: string;
    projectName: string;
    totalWbsItems: number;
    assignedWbsItems: number;
    assignmentRate: number;
  }[];
  wbsStats: {
    wbsItemId: string;
    wbsItemTitle: string;
    wbsItemCode: string;
    assignedCount: number;
  }[];
}

/**
 * WBS 할당 통계 결과
 */
export interface WbsAssignmentStatisticsResult {
  periodId: string;
  departmentId?: string;
  totalAssignments: number;
  uniqueEmployees: number;
  uniqueProjects: number;
  uniqueWbsItems: number;
  averageWbsItemsPerEmployee: number;
  averageEmployeesPerWbsItem: number;
  departmentBreakdown: {
    departmentId: string;
    departmentName: string;
    assignmentCount: number;
    employeeCount: number;
  }[];
}
