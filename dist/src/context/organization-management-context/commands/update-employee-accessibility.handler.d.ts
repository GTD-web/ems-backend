import { ICommand, ICommandHandler } from '@nestjs/cqrs';
import { EmployeeService } from '../../../domain/common/employee/employee.service';
import { EmployeeDto } from '../../../domain/common/employee/employee.types';
export declare class UpdateEmployeeAccessibilityCommand implements ICommand {
    readonly employeeId: string;
    readonly isAccessible: boolean;
    readonly updatedBy: string;
    constructor(employeeId: string, isAccessible: boolean, updatedBy: string);
}
export declare class UpdateEmployeeAccessibilityHandler implements ICommandHandler<UpdateEmployeeAccessibilityCommand> {
    private readonly employeeService;
    constructor(employeeService: EmployeeService);
    execute(command: UpdateEmployeeAccessibilityCommand): Promise<EmployeeDto>;
}
