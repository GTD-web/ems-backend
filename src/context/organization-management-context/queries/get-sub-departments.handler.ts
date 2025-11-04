import { IQuery, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { DepartmentService } from '../../../domain/common/department/department.service';
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
  constructor(private readonly departmentService: DepartmentService) {}

  async execute(query: GetSubDepartmentsQuery): Promise<DepartmentDto[]> {
    const { departmentId } = query;
    const department = await this.departmentService.findById(departmentId);
    if (!department) {
      return [];
    }
    // parentDepartmentId는 외부 시스템 ID이므로 externalId로 매칭
    return this.departmentService.하위_부서_조회한다(department.externalId);
  }
}
