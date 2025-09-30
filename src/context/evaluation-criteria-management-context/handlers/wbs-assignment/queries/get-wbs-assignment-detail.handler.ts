import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { EvaluationWbsAssignmentService } from '../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';
import type { EvaluationWbsAssignmentDto } from '../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';

/**
 * WBS 할당 상세 조회 쿼리
 */
export class GetWbsAssignmentDetailQuery {
  constructor(public readonly assignmentId: string) {}
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
