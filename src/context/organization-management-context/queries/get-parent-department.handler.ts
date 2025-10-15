import { IQuery, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { DepartmentRepository } from '../../../domain/common/department/department.repository';
import type { DepartmentDto } from '../../../domain/common/department/department.types';

/**
 * 상위 부서 조회 쿼리
 */
export class GetParentDepartmentQuery implements IQuery {
  constructor(public readonly departmentId: string) {}
}

/**
 * 상위 부서 조회 쿼리 핸들러
 */
@QueryHandler(GetParentDepartmentQuery)
@Injectable()
export class GetParentDepartmentQueryHandler
  implements IQueryHandler<GetParentDepartmentQuery>
{
  constructor(private readonly departmentRepository: DepartmentRepository) {}

  async execute(
    query: GetParentDepartmentQuery,
  ): Promise<DepartmentDto | null> {
    const { departmentId } = query;
    const department = await this.departmentRepository.findById(departmentId);

    if (!department || !department.parentDepartmentId) {
      return null;
    }

    const parentDepartment = await this.departmentRepository.findById(
      department.parentDepartmentId,
    );
    return parentDepartment ? parentDepartment.DTO로_변환한다() : null;
  }
}
