import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import type { EvaluationWbsAssignmentDto } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';

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
    @InjectRepository(EvaluationWbsAssignment)
    private readonly wbsAssignmentRepository: Repository<EvaluationWbsAssignment>,
  ) {}

  async execute(
    query: GetWbsAssignmentDetailQuery,
  ): Promise<EvaluationWbsAssignmentDto | null> {
    const { assignmentId } = query;

    const assignment = await this.wbsAssignmentRepository.findOne({
      where: {
        id: assignmentId,
        deletedAt: IsNull(),
      },
    });

    return assignment ? assignment.DTO로_변환한다() : null;
  }
}
