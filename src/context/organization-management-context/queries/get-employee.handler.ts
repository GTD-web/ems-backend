import { IQuery, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { EmployeeRepository } from '../../../domain/common/employee/employee.repository';
import type { EmployeeDto } from '../../../domain/common/employee/employee.types';

/**
 * 직원 정보 조회 쿼리
 */
export class GetEmployeeQuery implements IQuery {
  constructor(public readonly employeeId: string) {}
}

/**
 * 직원 정보 조회 쿼리 핸들러
 */
@QueryHandler(GetEmployeeQuery)
@Injectable()
export class GetEmployeeQueryHandler
  implements IQueryHandler<GetEmployeeQuery>
{
  constructor(private readonly employeeRepository: EmployeeRepository) {}

  async execute(query: GetEmployeeQuery): Promise<EmployeeDto | null> {
    const { employeeId } = query;
    const employee = await this.employeeRepository.findById(employeeId);
    return employee ? employee.DTO로_변환한다() : null;
  }
}
