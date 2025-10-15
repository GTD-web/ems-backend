import { IQuery, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { DepartmentRepository } from '../../../domain/common/department/department.repository';
import type { DepartmentDto } from '../../../domain/common/department/department.types';

/**
 * 부서 정보 조회 쿼리
 */
export class GetDepartmentQuery implements IQuery {
  constructor(public readonly departmentId: string) {}
}

/**
 * 부서 정보 조회 쿼리 핸들러
 */
@QueryHandler(GetDepartmentQuery)
@Injectable()
export class GetDepartmentQueryHandler
  implements IQueryHandler<GetDepartmentQuery>
{
  constructor(private readonly departmentRepository: DepartmentRepository) {}

  async execute(query: GetDepartmentQuery): Promise<DepartmentDto | null> {
    const { departmentId } = query;
    const department = await this.departmentRepository.findById(departmentId);
    return department ? department.DTO로_변환한다() : null;
  }
}
