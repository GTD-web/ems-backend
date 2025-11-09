import { IQuery, IQueryHandler } from '@nestjs/cqrs';
import { EmployeeService } from '../../../domain/common/employee/employee.service';
import type { EmployeeDto } from '../../../domain/common/employee/employee.types';
export declare class GetActiveEmployeesQuery implements IQuery {
}
export declare class GetActiveEmployeesQueryHandler implements IQueryHandler<GetActiveEmployeesQuery> {
    private readonly employeeService;
    constructor(employeeService: EmployeeService);
    execute(query: GetActiveEmployeesQuery): Promise<EmployeeDto[]>;
}
