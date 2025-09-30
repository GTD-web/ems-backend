import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EvaluationProjectAssignmentDto } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.types';

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
    @InjectRepository(EvaluationProjectAssignment)
    private readonly projectAssignmentRepository: Repository<EvaluationProjectAssignment>,
  ) {}

  async execute(
    query: GetProjectAssignedEmployeesQuery,
  ): Promise<EvaluationProjectAssignmentDto[]> {
    const { projectId, periodId } = query;

    const assignments = await this.projectAssignmentRepository
      .createQueryBuilder('assignment')
      .where('assignment.deletedAt IS NULL')
      .andWhere('assignment.projectId = :projectId', { projectId })
      .andWhere('assignment.periodId = :periodId', { periodId })
      .orderBy('assignment.assignedDate', 'DESC')
      .getMany();

    return assignments.map((assignment) => assignment.DTO로_변환한다());
  }
}
