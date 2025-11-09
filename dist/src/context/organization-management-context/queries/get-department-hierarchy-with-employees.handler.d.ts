import { IQuery, IQueryHandler } from '@nestjs/cqrs';
import { DepartmentService } from '../../../domain/common/department/department.service';
import { EmployeeService } from '../../../domain/common/employee/employee.service';
import type { DepartmentHierarchyWithEmployeesDto } from '../interfaces/organization-management-context.interface';
export declare class GetDepartmentHierarchyWithEmployeesQuery implements IQuery {
}
export declare class GetDepartmentHierarchyWithEmployeesQueryHandler implements IQueryHandler<GetDepartmentHierarchyWithEmployeesQuery> {
    private readonly departmentService;
    private readonly employeeService;
    constructor(departmentService: DepartmentService, employeeService: EmployeeService);
    execute(query: GetDepartmentHierarchyWithEmployeesQuery): Promise<DepartmentHierarchyWithEmployeesDto[]>;
    private calculateHierarchyInfo;
}
