import { IQuery, IQueryHandler } from '@nestjs/cqrs';
import { DepartmentService } from '../../../domain/common/department/department.service';
import { EmployeeService } from '../../../domain/common/employee/employee.service';
import type { OrganizationChartDto } from '../interfaces/organization-management-context.interface';
export declare class GetOrganizationChartQuery implements IQuery {
}
export declare class GetOrganizationChartQueryHandler implements IQueryHandler<GetOrganizationChartQuery> {
    private readonly departmentService;
    private readonly employeeService;
    constructor(departmentService: DepartmentService, employeeService: EmployeeService);
    execute(query: GetOrganizationChartQuery): Promise<OrganizationChartDto>;
}
