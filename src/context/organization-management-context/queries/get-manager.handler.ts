import { IQuery, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { EmployeeService } from '../../../domain/common/employee/employee.service';
import type { EmployeeDto } from '../../../domain/common/employee/employee.types';

/**
 * 상급자 조회 쿼리
 */
export class GetManagerQuery implements IQuery {
  constructor(public readonly employeeId: string) {}
}

/**
 * 상급자 조회 쿼리 핸들러
 */
@QueryHandler(GetManagerQuery)
@Injectable()
export class GetManagerQueryHandler implements IQueryHandler<GetManagerQuery> {
  constructor(private readonly employeeService: EmployeeService) {}

  async execute(query: GetManagerQuery): Promise<EmployeeDto | null> {
    const { employeeId } = query;
    const employee = await this.employeeService.findById(employeeId);

    if (!employee || !employee.managerId) {
      return null;
    }

    const manager = await this.employeeService.findById(employee.managerId);
    return manager ? manager.DTO로_변환한다() : null;
  }
}
