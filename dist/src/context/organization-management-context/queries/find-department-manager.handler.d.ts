import { IQuery, IQueryHandler } from '@nestjs/cqrs';
import { EmployeeService } from '../../../domain/common/employee/employee.service';
import { DepartmentService } from '../../../domain/common/department/department.service';
export declare class FindDepartmentManagerQuery implements IQuery {
    readonly employeeId: string;
    constructor(employeeId: string);
}
export declare class FindDepartmentManagerHandler implements IQueryHandler<FindDepartmentManagerQuery, string | null> {
    private readonly employeeService;
    private readonly departmentService;
    private readonly logger;
    constructor(employeeService: EmployeeService, departmentService: DepartmentService);
    execute(query: FindDepartmentManagerQuery): Promise<string | null>;
    private 부서장을_찾는다;
}
