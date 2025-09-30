import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { EvaluationProjectAssignmentService } from '../../../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.service';

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
 * 할당되지 않은 직원 목록 조회 쿼리 핸들러
 */
@QueryHandler(GetUnassignedEmployeesQuery)
@Injectable()
export class GetUnassignedEmployeesHandler
  implements IQueryHandler<GetUnassignedEmployeesQuery>
{
  constructor(
    private readonly projectAssignmentService: EvaluationProjectAssignmentService,
  ) {}

  async execute(query: GetUnassignedEmployeesQuery): Promise<string[]> {
    const { periodId, projectId } = query;
    const assignments =
      await this.projectAssignmentService.평가기간별_조회한다(periodId);
    const assignedEmployeeIds = assignments.map((a) => a.employeeId);

    // TODO: 실제 Employee 서비스에서 전체 직원 목록을 조회하고
    // 할당된 직원 ID를 제외해야 함
    return assignedEmployeeIds; // 임시로 할당된 직원 ID 반환
  }
}
