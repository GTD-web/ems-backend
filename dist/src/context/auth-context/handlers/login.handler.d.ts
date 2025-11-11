import { SSOService } from '@domain/common/sso';
import { EmployeeService } from '@domain/common/employee/employee.service';
import { LoginCommand, LoginResult } from '../interfaces/auth-context.interface';
export declare class LoginHandler {
    private readonly ssoService;
    private readonly employeeService;
    private readonly logger;
    constructor(ssoService: SSOService, employeeService: EmployeeService);
    execute(command: LoginCommand): Promise<LoginResult>;
}
