import { IQuery, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { EmployeeRepository } from '../../../domain/common/employee/employee.repository';
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
  constructor(private readonly employeeRepository: EmployeeRepository) {}

  async execute(query: GetEmployeesByDepartmentQuery): Promise<EmployeeDto[]> {
    const { departmentId } = query;
    const employees =
      await this.employeeRepository.findByDepartmentId(departmentId);
    return employees.map((emp) => emp.DTO로_변환한다());
  }
}
