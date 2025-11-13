import { IQuery, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { EmployeeService } from '../../../domain/common/employee/employee.service';
import type { EmployeeDto } from '../../../domain/common/employee/employee.types';

/**
 * 전체 직원 목록 조회 쿼리
 */
export class GetAllEmployeesQuery implements IQuery {
  constructor(
    public readonly includeExcluded: boolean = false,
    public readonly departmentId?: string,
  ) {}
}

/**
 * 전체 직원 목록 조회 쿼리 핸들러
 */
@QueryHandler(GetAllEmployeesQuery)
@Injectable()
export class GetAllEmployeesQueryHandler
  implements IQueryHandler<GetAllEmployeesQuery>
{
  constructor(private readonly employeeService: EmployeeService) {}

  async execute(query: GetAllEmployeesQuery): Promise<EmployeeDto[]> {
    // departmentId가 있으면 필터 조회 사용
    if (query.departmentId) {
      return await this.employeeService.필터_조회한다({
        departmentId: query.departmentId,
        includeExcluded: query.includeExcluded,
      });
    }

    // departmentId가 없으면 전체 조회
    const employees = await this.employeeService.findAll(
      query.includeExcluded,
    );
    return employees.map((emp) => emp.DTO로_변환한다());
  }
}
