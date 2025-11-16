import { DepartmentHierarchyDto, DepartmentHierarchyWithEmployeesDto } from '@context/organization-management-context/interfaces/organization-management-context.interface';
import { OrganizationManagementService } from '@context/organization-management-context/organization-management.service';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import type { AuthenticatedUser } from '@interface/common/decorators/current-user.decorator';
import { ExcludeEmployeeFromListDto, GetEmployeesQueryDto } from '@interface/common/dto/employee-management/employee-management.dto';
export declare class EmployeeManagementController {
    private readonly organizationManagementService;
    constructor(organizationManagementService: OrganizationManagementService);
    getDepartmentHierarchy(): Promise<DepartmentHierarchyDto[]>;
    getDepartmentHierarchyWithEmployees(): Promise<DepartmentHierarchyWithEmployeesDto[]>;
    getAllEmployees(query: GetEmployeesQueryDto, includeExcluded: boolean): Promise<EmployeeDto[]>;
    getExcludedEmployees(): Promise<EmployeeDto[]>;
    excludeEmployeeFromList(employeeId: string, excludeData: ExcludeEmployeeFromListDto, user: AuthenticatedUser): Promise<EmployeeDto>;
    includeEmployeeInList(employeeId: string, user: AuthenticatedUser): Promise<EmployeeDto>;
    updateEmployeeAccessibility(employeeId: string, isAccessible: boolean, user: AuthenticatedUser): Promise<EmployeeDto>;
}
