import { EmployeeService } from '@domain/common/employee/employee.service';
import { GetUserWithRolesQuery, GetUserWithRolesResult } from '../interfaces/auth-context.interface';
export declare class GetUserWithRolesHandler {
    private readonly employeeService;
    private readonly logger;
    constructor(employeeService: EmployeeService);
    execute(query: GetUserWithRolesQuery): Promise<GetUserWithRolesResult>;
}
