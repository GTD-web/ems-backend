import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';

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
    @InjectRepository(EvaluationProjectAssignment)
    private readonly projectAssignmentRepository: Repository<EvaluationProjectAssignment>,
  ) {}

  async execute(query: GetUnassignedEmployeesQuery): Promise<string[]> {
    const { periodId, projectId } = query;

    // 해당 평가기간에 할당된 직원 ID 조회
    const queryBuilder = this.projectAssignmentRepository
      .createQueryBuilder('assignment')
      .select('assignment.employeeId')
      .where('assignment.deletedAt IS NULL')
      .andWhere('assignment.periodId = :periodId', { periodId });

    if (projectId) {
      queryBuilder.andWhere('assignment.projectId = :projectId', { projectId });
    }

    const assignedEmployeeIds = await queryBuilder
      .getRawMany()
      .then((results) => results.map((result) => result.employeeId));

    // TODO: 실제 Employee 엔티티에서 전체 직원 목록을 조회하고
    // 할당된 직원 ID를 제외해야 함
    // 현재는 할당된 직원 ID만 반환 (임시)
    return assignedEmployeeIds;
  }
}
