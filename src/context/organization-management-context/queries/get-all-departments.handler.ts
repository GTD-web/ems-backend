import { IQuery, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { DepartmentService } from '../../../domain/common/department/department.service';
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
  constructor(private readonly departmentService: DepartmentService) {}

  async execute(query: GetAllDepartmentsQuery): Promise<DepartmentDto[]> {
    return this.departmentService.전체_조회한다();
  }
}
