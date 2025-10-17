import { IQuery, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { EmployeeTestService } from '../../../domain/common/employee/employee-test.service';

/**
 * 테스트 환경 상태
 */
export interface TestEnvironmentStatus {
  departmentCount: number;
  employeeCount: number;
  projectCount: number;
  wbsItemCount: number;
}

/**
 * 테스트 환경 상태 조회 쿼리
 */
export class GetTestEnvironmentStatusQuery implements IQuery {}

/**
 * 테스트 환경 상태 조회 핸들러
 */
@QueryHandler(GetTestEnvironmentStatusQuery)
@Injectable()
export class GetTestEnvironmentStatusHandler
  implements IQueryHandler<GetTestEnvironmentStatusQuery, TestEnvironmentStatus>
{
  constructor(private readonly employeeTestService: EmployeeTestService) {}

  async execute(
    query: GetTestEnvironmentStatusQuery,
  ): Promise<TestEnvironmentStatus> {
    const employeeCount =
      await this.employeeTestService.현재_직원_수를_조회한다();

    console.log(`현재 테스트 환경 상태 - 직원: ${employeeCount}명`);

    return {
      departmentCount: 0,
      employeeCount,
      projectCount: 0,
      wbsItemCount: 0,
    };
  }
}
