import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import type { EvaluationWbsAssignmentDto } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';

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
    @InjectRepository(EvaluationWbsAssignment)
    private readonly wbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
  ) {}

  async execute(
    query: GetWbsItemAssignmentsQuery,
  ): Promise<EvaluationWbsAssignmentDto[]> {
    const { wbsItemId, periodId } = query;

    const assignments = await this.wbsAssignmentRepository.find({
      where: {
        wbsItemId,
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
