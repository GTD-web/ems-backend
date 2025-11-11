import { IQuery, IQueryHandler } from '@nestjs/cqrs';
import { EmployeeService } from '../../../domain/common/employee/employee.service';
import type { EmployeeDto } from '../../../domain/common/employee/employee.types';
export declare class GetManagerQuery implements IQuery {
    readonly employeeId: string;
    constructor(employeeId: string);
}
export declare class GetManagerQueryHandler implements IQueryHandler<GetManagerQuery> {
    private readonly employeeService;
    constructor(employeeService: EmployeeService);
    execute(query: GetManagerQuery): Promise<EmployeeDto | null>;
}
