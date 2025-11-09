import { IQuery, IQueryHandler } from '@nestjs/cqrs';
import { EmployeeService } from '../../../domain/common/employee/employee.service';
import type { EmployeeDto } from '../../../domain/common/employee/employee.types';
export declare class GetEmployeesByDepartmentQuery implements IQuery {
    readonly departmentId: string;
    constructor(departmentId: string);
}
export declare class GetEmployeesByDepartmentQueryHandler implements IQueryHandler<GetEmployeesByDepartmentQuery> {
    private readonly employeeService;
    constructor(employeeService: EmployeeService);
    execute(query: GetEmployeesByDepartmentQuery): Promise<EmployeeDto[]>;
}
