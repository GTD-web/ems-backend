import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { EvaluationProjectAssignmentService } from '../../../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.service';
import { EvaluationProjectAssignmentDto } from '../../../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.types';

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
