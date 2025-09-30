import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { EvaluationProjectAssignmentService } from '../../../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.service';
import { EvaluationProjectAssignmentDto } from '../../../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.types';

/**
 * 프로젝트 할당 상세 조회 쿼리
 */
export class GetProjectAssignmentDetailQuery {
  constructor(public readonly assignmentId: string) {}
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
