import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EvaluationProjectAssignmentDto } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.types';

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
    @InjectRepository(EvaluationProjectAssignment)
    private readonly projectAssignmentRepository: Repository<EvaluationProjectAssignment>,
  ) {}

  async execute(
    query: GetEmployeeProjectAssignmentsQuery,
  ): Promise<EvaluationProjectAssignmentDto[]> {
    const { employeeId, periodId } = query;

    const assignments = await this.projectAssignmentRepository
      .createQueryBuilder('assignment')
      .where('assignment.deletedAt IS NULL')
      .andWhere('assignment.periodId = :periodId', { periodId })
      .andWhere('assignment.employeeId = :employeeId', { employeeId })
      .orderBy('assignment.assignedDate', 'DESC')
      .getMany();

    return assignments.map((assignment) => assignment.DTO로_변환한다());
  }
}
