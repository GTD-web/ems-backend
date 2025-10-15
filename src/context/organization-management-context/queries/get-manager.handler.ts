import { IQuery, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { EmployeeRepository } from '../../../domain/common/employee/employee.repository';
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
  constructor(private readonly employeeRepository: EmployeeRepository) {}

  async execute(query: GetManagerQuery): Promise<EmployeeDto | null> {
    const { employeeId } = query;
    const employee = await this.employeeRepository.findById(employeeId);

    if (!employee || !employee.managerId) {
      return null;
    }

    const manager = await this.employeeRepository.findById(employee.managerId);
    return manager ? manager.DTO로_변환한다() : null;
  }
}
