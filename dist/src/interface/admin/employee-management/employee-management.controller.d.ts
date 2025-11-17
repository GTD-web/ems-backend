import { DepartmentHierarchyDto, DepartmentHierarchyWithEmployeesDto, EmployeeSyncService, OrganizationManagementService } from '@/context/organization-management-context';
import { EmployeeDto } from '@/domain/common/employee/employee.types';
import { ExcludeEmployeeFromListDto, GetEmployeesQueryDto, GetPartLeadersQueryDto, PartLeadersResponseDto } from '@/interface/common/dto/employee-management/employee-management.dto';
import type { AuthenticatedUser } from '@/interface/common/guards';
export declare class EmployeeManagementController {
    private readonly organizationManagementService;
    private readonly employeeSyncService;
    constructor(organizationManagementService: OrganizationManagementService, employeeSyncService: EmployeeSyncService);
    getDepartmentHierarchy(): Promise<DepartmentHierarchyDto[]>;
    getDepartmentHierarchyWithEmployees(): Promise<DepartmentHierarchyWithEmployeesDto[]>;
    getAllEmployees(query: GetEmployeesQueryDto, includeExcluded: boolean): Promise<EmployeeDto[]>;
    getExcludedEmployees(): Promise<EmployeeDto[]>;
    getPartLeaders(query: GetPartLeadersQueryDto): Promise<PartLeadersResponseDto>;
    excludeEmployeeFromList(employeeId: string, excludeData: ExcludeEmployeeFromListDto, user: AuthenticatedUser): Promise<EmployeeDto>;
    includeEmployeeInList(employeeId: string, user: AuthenticatedUser): Promise<EmployeeDto>;
    updateEmployeeAccessibility(employeeId: string, isAccessible: boolean, user: AuthenticatedUser): Promise<EmployeeDto>;
}
