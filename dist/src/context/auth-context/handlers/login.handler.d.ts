import type { ISSOService } from '@domain/common/sso/interfaces';
import { EmployeeService } from '@domain/common/employee/employee.service';
import { LoginCommand, LoginResult } from '../interfaces/auth-context.interface';
export declare class LoginHandler {
    private readonly ssoService;
    private readonly employeeService;
    private readonly logger;
    constructor(ssoService: ISSOService, employeeService: EmployeeService);
    execute(command: LoginCommand): Promise<LoginResult>;
}
