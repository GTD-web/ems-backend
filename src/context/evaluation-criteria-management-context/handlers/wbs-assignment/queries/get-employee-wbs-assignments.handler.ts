import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import type { EvaluationWbsAssignmentDto } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';

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
    @InjectRepository(EvaluationWbsAssignment)
    private readonly wbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
  ) {}

  async execute(
    query: GetEmployeeWbsAssignmentsQuery,
  ): Promise<EvaluationWbsAssignmentDto[]> {
    const { employeeId, periodId } = query;

    const assignments = await this.wbsAssignmentRepository.find({
      where: {
        employeeId,
        periodId,
        deletedAt: IsNull(),
      },
      order: {
        assignedDate: 'DESC',
      },
    });

    return assignments.map((assignment) => assignment.DTO로_변환한다());
  }
}
