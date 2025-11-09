import { OrganizationManagementService } from '../../../context/organization-management-context/organization-management.service';
import { EmployeeDto } from '../../../domain/common/employee/employee.types';
import { DepartmentHierarchyDto, DepartmentHierarchyWithEmployeesDto } from '../../../context/organization-management-context/interfaces/organization-management-context.interface';
import type { AuthenticatedUser } from '../../decorators';
import { ExcludeEmployeeFromListDto, GetEmployeesQueryDto } from './dto/employee-management.dto';
export declare class EmployeeManagementController {
    private readonly organizationManagementService;
    constructor(organizationManagementService: OrganizationManagementService);
    getDepartmentHierarchy(): Promise<DepartmentHierarchyDto[]>;
    getDepartmentHierarchyWithEmployees(): Promise<DepartmentHierarchyWithEmployeesDto[]>;
    getAllEmployees(query: GetEmployeesQueryDto): Promise<EmployeeDto[]>;
    getExcludedEmployees(): Promise<EmployeeDto[]>;
    excludeEmployeeFromList(employeeId: string, excludeData: ExcludeEmployeeFromListDto, user: AuthenticatedUser): Promise<EmployeeDto>;
    includeEmployeeInList(employeeId: string, user: AuthenticatedUser): Promise<EmployeeDto>;
}
