import { IQuery, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { DepartmentService } from '../../../domain/common/department/department.service';
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
  constructor(private readonly departmentService: DepartmentService) {}

  async execute(
    query: GetParentDepartmentQuery,
  ): Promise<DepartmentDto | null> {
    const { departmentId } = query;
    const department = await this.departmentService.findById(departmentId);

    if (!department || !department.parentDepartmentId) {
      return null;
    }

    // parentDepartmentId는 외부 시스템 ID이므로 externalId로 조회
    const parentDepartment =
      await this.departmentService.findByExternalId(
        department.parentDepartmentId,
      );
    return parentDepartment ? parentDepartment.DTO로_변환한다() : null;
  }
}
