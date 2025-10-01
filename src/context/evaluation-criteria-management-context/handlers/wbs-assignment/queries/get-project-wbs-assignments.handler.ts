import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import type { EvaluationWbsAssignmentDto } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';

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
    @InjectRepository(EvaluationWbsAssignment)
    private readonly wbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
  ) {}

  async execute(
    query: GetProjectWbsAssignmentsQuery,
  ): Promise<EvaluationWbsAssignmentDto[]> {
    const { projectId, periodId } = query;

    const assignments = await this.wbsAssignmentRepository.find({
      where: {
        projectId,
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
