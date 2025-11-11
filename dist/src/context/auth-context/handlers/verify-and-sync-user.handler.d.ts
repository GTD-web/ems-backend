import { SSOService } from '@domain/common/sso';
import { EmployeeService } from '@domain/common/employee/employee.service';
import { VerifyAndSyncUserCommand, VerifyAndSyncUserResult } from '../interfaces/auth-context.interface';
export declare class VerifyAndSyncUserHandler {
    private readonly ssoService;
    private readonly employeeService;
    private readonly logger;
    constructor(ssoService: SSOService, employeeService: EmployeeService);
    execute(command: VerifyAndSyncUserCommand): Promise<VerifyAndSyncUserResult>;
}
