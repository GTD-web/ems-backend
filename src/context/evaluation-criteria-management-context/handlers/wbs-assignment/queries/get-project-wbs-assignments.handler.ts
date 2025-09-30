import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { EvaluationWbsAssignmentService } from '../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';
import type { EvaluationWbsAssignmentDto } from '../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';

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
