import { IQuery, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { EmployeeService } from '../../../domain/common/employee/employee.service';
import type { EmployeeDto } from '../../../domain/common/employee/employee.types';

/**
 * 활성 직원 목록 조회 쿼리
 */
export class GetActiveEmployeesQuery implements IQuery {}

/**
 * 활성 직원 목록 조회 쿼리 핸들러
 */
@QueryHandler(GetActiveEmployeesQuery)
@Injectable()
export class GetActiveEmployeesQueryHandler
  implements IQueryHandler<GetActiveEmployeesQuery>
{
  constructor(private readonly employeeService: EmployeeService) {}

  async execute(query: GetActiveEmployeesQuery): Promise<EmployeeDto[]> {
    const employees = await this.employeeService.findByStatus('재직중');
    return employees.map((emp) => emp.DTO로_변환한다());
  }
}
