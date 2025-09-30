import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { EvaluationWbsAssignmentService } from '../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';
import { EvaluationWbsAssignmentFilter } from '../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';

/**
 * WBS 할당 목록 조회 쿼리
 */
export class GetWbsAssignmentListQuery {
  constructor(public readonly filter: EvaluationWbsAssignmentFilter) {}
}

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
