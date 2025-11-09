import { IQuery, IQueryHandler } from '@nestjs/cqrs';
import { EmployeeService } from '../../../domain/common/employee/employee.service';
import type { EmployeeDto } from '../../../domain/common/employee/employee.types';
export declare class GetSubordinatesQuery implements IQuery {
    readonly employeeId: string;
    constructor(employeeId: string);
}
export declare class GetSubordinatesQueryHandler implements IQueryHandler<GetSubordinatesQuery> {
    private readonly employeeService;
    constructor(employeeService: EmployeeService);
    execute(query: GetSubordinatesQuery): Promise<EmployeeDto[]>;
}
