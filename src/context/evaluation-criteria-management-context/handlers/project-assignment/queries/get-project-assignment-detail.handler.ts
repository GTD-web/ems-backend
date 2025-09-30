import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EvaluationProjectAssignmentDto } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.types';

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
    @InjectRepository(EvaluationProjectAssignment)
    private readonly projectAssignmentRepository: Repository<EvaluationProjectAssignment>,
  ) {}

  async execute(
    query: GetProjectAssignmentDetailQuery,
  ): Promise<EvaluationProjectAssignmentDto | null> {
    const { assignmentId } = query;

    const assignment = await this.projectAssignmentRepository
      .createQueryBuilder('assignment')
      .where('assignment.id = :assignmentId', { assignmentId })
      .andWhere('assignment.deletedAt IS NULL')
      .getOne();

    return assignment ? assignment.DTO로_변환한다() : null;
  }
}
