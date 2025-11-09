import { ICommand, ICommandHandler } from '@nestjs/cqrs';
import { EmployeeService } from '../../../domain/common/employee/employee.service';
import { EmployeeDto } from '../../../domain/common/employee/employee.types';
export declare class IncludeEmployeeInListCommand implements ICommand {
    readonly employeeId: string;
    readonly updatedBy: string;
    constructor(employeeId: string, updatedBy: string);
}
export declare class IncludeEmployeeInListHandler implements ICommandHandler<IncludeEmployeeInListCommand> {
    private readonly employeeService;
    constructor(employeeService: EmployeeService);
    execute(command: IncludeEmployeeInListCommand): Promise<EmployeeDto>;
}
