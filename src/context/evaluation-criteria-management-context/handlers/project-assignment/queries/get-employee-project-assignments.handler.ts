import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { EvaluationProjectAssignmentService } from '../../../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.service';
import { EvaluationProjectAssignmentDto } from '../../../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.types';

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
 * 직원의 프로젝트 할당 조회 쿼리 핸들러
 */
@QueryHandler(GetEmployeeProjectAssignmentsQuery)
@Injectable()
export class GetEmployeeProjectAssignmentsHandler
  implements IQueryHandler<GetEmployeeProjectAssignmentsQuery>
{
  constructor(
    private readonly projectAssignmentService: EvaluationProjectAssignmentService,
  ) {}

  async execute(
    query: GetEmployeeProjectAssignmentsQuery,
  ): Promise<EvaluationProjectAssignmentDto[]> {
    const { employeeId, periodId } = query;
    const assignments =
      await this.projectAssignmentService.평가기간_직원별_조회한다(
        periodId,
        employeeId,
      );
    return assignments.map((a) => a.DTO로_변환한다());
  }
}
