import { IQuery, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { EmployeeService } from '../../../domain/common/employee/employee.service';
import type { EmployeeDto } from '../../../domain/common/employee/employee.types';

/**
 * 부서별 직원 목록 조회 쿼리
 */
export class GetEmployeesByDepartmentQuery implements IQuery {
  constructor(public readonly departmentId: string) {}
}

/**
 * 부서별 직원 목록 조회 쿼리 핸들러
 */
@QueryHandler(GetEmployeesByDepartmentQuery)
@Injectable()
export class GetEmployeesByDepartmentQueryHandler
  implements IQueryHandler<GetEmployeesByDepartmentQuery>
{
  constructor(private readonly employeeService: EmployeeService) {}

  async execute(query: GetEmployeesByDepartmentQuery): Promise<EmployeeDto[]> {
    const { departmentId } = query;
    const employees =
      await this.employeeService.findByDepartmentId(departmentId);
    return employees.map((emp) => emp.DTO로_변환한다());
  }
}
