import { DepartmentHierarchyDto, DepartmentHierarchyWithEmployeesDto } from '@context/organization-management-context/interfaces/organization-management-context.interface';
import { OrganizationManagementService } from '@context/organization-management-context/organization-management.service';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { GetEmployeesQueryDto } from '@interface/common/dto/employee-management/employee-management.dto';
export declare class EvaluatorEmployeeManagementController {
    private readonly organizationManagementService;
    constructor(organizationManagementService: OrganizationManagementService);
    getDepartmentHierarchy(): Promise<DepartmentHierarchyDto[]>;
    getDepartmentHierarchyWithEmployees(): Promise<DepartmentHierarchyWithEmployeesDto[]>;
    getAllEmployees(query: GetEmployeesQueryDto): Promise<EmployeeDto[]>;
}
