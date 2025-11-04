import { IQuery, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { EmployeeService } from '../../../domain/common/employee/employee.service';
import type { EmployeeDto } from '../../../domain/common/employee/employee.types';

/**
 * 하급자 목록 조회 쿼리
 */
export class GetSubordinatesQuery implements IQuery {
  constructor(public readonly employeeId: string) {}
}

/**
 * 하급자 목록 조회 쿼리 핸들러
 */
@QueryHandler(GetSubordinatesQuery)
@Injectable()
export class GetSubordinatesQueryHandler
  implements IQueryHandler<GetSubordinatesQuery>
{
  constructor(private readonly employeeService: EmployeeService) {}

  async execute(query: GetSubordinatesQuery): Promise<EmployeeDto[]> {
    const { employeeId } = query;
    // findByManagerId가 없으므로 필터를 사용하여 매니저 ID로 검색
    const subordinates = await this.employeeService.findByFilter({
      managerId: employeeId,
    });
    return subordinates.map((emp) => emp.DTO로_변환한다());
  }
}
