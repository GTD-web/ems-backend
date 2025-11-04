import { IQuery, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { DepartmentService } from '../../../domain/common/department/department.service';
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
  constructor(private readonly departmentService: DepartmentService) {}

  async execute(query: GetDepartmentQuery): Promise<DepartmentDto | null> {
    const { departmentId } = query;
    return this.departmentService.ID로_조회한다(departmentId);
  }
}
