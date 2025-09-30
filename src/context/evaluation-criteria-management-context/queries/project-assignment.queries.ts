import { EvaluationProjectAssignmentFilter } from '../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.types';

/**
 * 프로젝트 할당 목록 조회 쿼리
 */
export class GetProjectAssignmentListQuery {
  constructor(public readonly filter: EvaluationProjectAssignmentFilter) {}
}

/**
 * 직원의 프로젝트 할당 조회 쿼리
 */
export class GetEmployeeProjectAssignmentsQuery {
  constructor(
    public readonly employeeId: string,
    public readonly periodId: string,
  ) {}
}

/**
 * 프로젝트별 할당된 직원 조회 쿼리
 */
export class GetProjectAssignedEmployeesQuery {
  constructor(
    public readonly projectId: string,
    public readonly periodId: string,
  ) {}
}

/**
 * 평가기간별 프로젝트 할당 현황 조회 쿼리
 */
export class GetPeriodProjectAssignmentStatusQuery {
  constructor(public readonly periodId: string) {}
}

/**
 * 프로젝트 할당 상세 조회 쿼리
 */
export class GetProjectAssignmentDetailQuery {
  constructor(public readonly assignmentId: string) {}
}

/**
 * 할당되지 않은 직원 목록 조회 쿼리
 */
export class GetUnassignedEmployeesQuery {
  constructor(
    public readonly periodId: string,
    public readonly projectId?: string,
  ) {}
}

/**
 * 프로젝트 할당 통계 조회 쿼리
 */
export class GetProjectAssignmentStatisticsQuery {
  constructor(
    public readonly periodId: string,
    public readonly departmentId?: string,
  ) {}
}

/**
 * 프로젝트 할당 목록 조회 결과
 */
export interface ProjectAssignmentListResult {
  assignments: Array<{
    id: string;
    periodId: string;
    employeeId: string;
    employeeName: string;
    departmentName: string;
    projectId: string;
    projectName: string;
    assignedDate: Date;
    assignedBy: string;
    assignedByName: string;
  }>;
  totalCount: number;
  page: number;
  limit: number;
}

/**
 * 프로젝트 할당 현황 결과
 */
export interface ProjectAssignmentStatusResult {
  periodId: string;
  totalEmployees: number;
  assignedEmployees: number;
  unassignedEmployees: number;
  assignmentRate: number;
  projectStats: Array<{
    projectId: string;
    projectName: string;
    assignedCount: number;
  }>;
}

/**
 * 프로젝트 할당 통계 결과
 */
export interface ProjectAssignmentStatisticsResult {
  periodId: string;
  departmentId?: string;
  totalAssignments: number;
  uniqueEmployees: number;
  uniqueProjects: number;
  averageProjectsPerEmployee: number;
  averageEmployeesPerProject: number;
  departmentBreakdown: Array<{
    departmentId: string;
    departmentName: string;
    assignmentCount: number;
    employeeCount: number;
  }>;
}
