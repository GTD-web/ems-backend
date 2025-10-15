import { IQuery, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { DepartmentRepository } from '../../../domain/common/department/department.repository';
import type { DepartmentDto } from '../../../domain/common/department/department.types';

/**
 * 전체 부서 목록 조회 쿼리
 */
export class GetAllDepartmentsQuery implements IQuery {}

/**
 * 전체 부서 목록 조회 쿼리 핸들러
 */
@QueryHandler(GetAllDepartmentsQuery)
@Injectable()
export class GetAllDepartmentsQueryHandler
  implements IQueryHandler<GetAllDepartmentsQuery>
{
  constructor(private readonly departmentRepository: DepartmentRepository) {}

  async execute(query: GetAllDepartmentsQuery): Promise<DepartmentDto[]> {
    const departments = await this.departmentRepository.findAll();
    return departments.map((dept) => dept.DTO로_변환한다());
  }
}
