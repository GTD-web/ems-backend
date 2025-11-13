import { IQuery, IQueryHandler } from '@nestjs/cqrs';
import { EmployeeService } from '../../../domain/common/employee/employee.service';
import type { EmployeeDto } from '../../../domain/common/employee/employee.types';
export declare class GetAllEmployeesQuery implements IQuery {
    readonly includeExcluded: boolean;
    readonly departmentId?: string | undefined;
    constructor(includeExcluded?: boolean, departmentId?: string | undefined);
}
export declare class GetAllEmployeesQueryHandler implements IQueryHandler<GetAllEmployeesQuery> {
    private readonly employeeService;
    constructor(employeeService: EmployeeService);
    execute(query: GetAllEmployeesQuery): Promise<EmployeeDto[]>;
}
