import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { EvaluationWbsAssignmentService } from '../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';
import type { EvaluationWbsAssignmentDto } from '../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';

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
