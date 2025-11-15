import type { ISSOService } from '@domain/common/sso/interfaces';
import { EmployeeService } from '@domain/common/employee/employee.service';
import { VerifyAndSyncUserCommand, VerifyAndSyncUserResult } from '../interfaces/auth-context.interface';
export declare class VerifyAndSyncUserHandler {
    private readonly ssoService;
    private readonly employeeService;
    private readonly logger;
    constructor(ssoService: ISSOService, employeeService: EmployeeService);
    execute(command: VerifyAndSyncUserCommand): Promise<VerifyAndSyncUserResult>;
}
