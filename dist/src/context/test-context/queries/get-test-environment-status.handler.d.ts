import { IQuery, IQueryHandler } from '@nestjs/cqrs';
import { EmployeeTestService } from '../../../domain/common/employee/employee-test.service';
export interface TestEnvironmentStatus {
    departmentCount: number;
    employeeCount: number;
    projectCount: number;
    wbsItemCount: number;
}
export declare class GetTestEnvironmentStatusQuery implements IQuery {
}
export declare class GetTestEnvironmentStatusHandler implements IQueryHandler<GetTestEnvironmentStatusQuery, TestEnvironmentStatus> {
    private readonly employeeTestService;
    constructor(employeeTestService: EmployeeTestService);
    execute(query: GetTestEnvironmentStatusQuery): Promise<TestEnvironmentStatus>;
}
