import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { EvaluationProjectAssignmentService } from '../../../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.service';
import { EvaluationProjectAssignmentFilter } from '../../../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.types';

/**
 * 프로젝트 할당 목록 조회 쿼리
 */
export class GetProjectAssignmentListQuery {
  constructor(public readonly filter: EvaluationProjectAssignmentFilter) {}
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
