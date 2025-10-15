import { IQuery, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { DepartmentRepository } from '../../../domain/common/department/department.repository';
import type { DepartmentDto } from '../../../domain/common/department/department.types';

/**
 * 하위 부서 목록 조회 쿼리
 */
export class GetSubDepartmentsQuery implements IQuery {
  constructor(public readonly departmentId: string) {}
}

/**
 * 하위 부서 목록 조회 쿼리 핸들러
 */
@QueryHandler(GetSubDepartmentsQuery)
@Injectable()
export class GetSubDepartmentsQueryHandler
  implements IQueryHandler<GetSubDepartmentsQuery>
{
  constructor(private readonly departmentRepository: DepartmentRepository) {}

  async execute(query: GetSubDepartmentsQuery): Promise<DepartmentDto[]> {
    const { departmentId } = query;
    const subDepartments =
      await this.departmentRepository.findByParentDepartmentId(departmentId);
    return subDepartments.map((dept) => dept.DTO로_변환한다());
  }
}
