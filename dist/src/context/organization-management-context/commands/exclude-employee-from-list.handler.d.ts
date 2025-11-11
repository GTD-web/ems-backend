import { ICommand, ICommandHandler } from '@nestjs/cqrs';
import { EmployeeService } from '../../../domain/common/employee/employee.service';
import { EmployeeDto } from '../../../domain/common/employee/employee.types';
export declare class ExcludeEmployeeFromListCommand implements ICommand {
    readonly employeeId: string;
    readonly excludeReason: string;
    readonly excludedBy: string;
    constructor(employeeId: string, excludeReason: string, excludedBy: string);
}
export declare class ExcludeEmployeeFromListHandler implements ICommandHandler<ExcludeEmployeeFromListCommand> {
    private readonly employeeService;
    constructor(employeeService: EmployeeService);
    execute(command: ExcludeEmployeeFromListCommand): Promise<EmployeeDto>;
}
