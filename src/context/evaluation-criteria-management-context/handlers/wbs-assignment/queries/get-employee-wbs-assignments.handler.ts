import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { EvaluationWbsAssignmentService } from '../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';
import type { EvaluationWbsAssignmentDto } from '../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';

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
 * 직원의 WBS 할당 조회 핸들러
 */
@QueryHandler(GetEmployeeWbsAssignmentsQuery)
@Injectable()
export class GetEmployeeWbsAssignmentsHandler
  implements IQueryHandler<GetEmployeeWbsAssignmentsQuery>
{
  constructor(
    private readonly wbsAssignmentService: EvaluationWbsAssignmentService,
  ) {}

  async execute(
    query: GetEmployeeWbsAssignmentsQuery,
  ): Promise<EvaluationWbsAssignmentDto[]> {
    const { employeeId, periodId } = query;
    const assignments =
      await this.wbsAssignmentService.평가기간_직원별_조회한다(
        periodId,
        employeeId,
      );
    return assignments.map((a) => a.DTO로_변환한다());
  }
}
