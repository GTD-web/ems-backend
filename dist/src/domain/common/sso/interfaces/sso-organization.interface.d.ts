export interface ISSOOrganizationService {
    직원정보를조회한다(params: GetEmployeeParams): Promise<EmployeeInfo>;
    여러직원정보를조회한다(params: GetEmployeesParams): Promise<EmployeeInfo[]>;
    부서계층구조를조회한다(params?: GetDepartmentHierarchyParams): Promise<DepartmentHierarchy>;
    직원관리자정보를조회한다(): Promise<GetEmployeesManagersResponse>;
}
export interface GetEmployeeParams {
    employeeNumber?: string;
    employeeId?: string;
    withDetail?: boolean;
}
export interface GetEmployeesParams {
    identifiers?: string[];
    withDetail?: boolean;
    includeTerminated?: boolean;
}
export interface GetDepartmentHierarchyParams {
    rootDepartmentId?: string;
    maxDepth?: number;
    withEmployeeDetail?: boolean;
    includeEmptyDepartments?: boolean;
}
export interface EmployeeInfo {
    id: string;
    employeeNumber: string;
    name: string;
    email: string;
    phoneNumber?: string;
    isTerminated: boolean;
    department?: DepartmentInfo;
    position?: PositionInfo;
    jobTitle?: JobTitleInfo;
}
export interface DepartmentInfo {
    id: string;
    departmentCode: string;
    departmentName: string;
    parentDepartmentId?: string;
}
export interface PositionInfo {
    id: string;
    positionName: string;
    positionLevel: number;
}
export interface JobTitleInfo {
    id: string;
    jobTitleName: string;
    jobTitleLevel: number;
}
export interface DepartmentHierarchy {
    departments: DepartmentNode[];
    totalDepartments: number;
    totalEmployees: number;
}
export interface DepartmentNode {
    id: string;
    departmentCode: string;
    departmentName: string;
    parentDepartmentId?: string;
    depth: number;
    employeeCount: number;
    employees: EmployeeInfo[];
    children: DepartmentNode[];
}
export interface GetEmployeesManagersResponse {
    employees: EmployeeManagers[];
    total: number;
}
export interface EmployeeManagers {
    employeeId: string;
    name: string;
    employeeNumber: string;
    departments: EmployeeDepartmentManagers[];
}
export interface EmployeeDepartmentManagers {
    departmentId: string;
    departmentName: string;
    managerLine: DepartmentManager[];
}
export interface DepartmentManager {
    departmentId: string;
    departmentName: string;
    departmentCode: string;
    type: string;
    parentDepartmentId?: string;
    depth: number;
    managers: ManagerInfo[];
}
export interface ManagerInfo {
    employeeId: string;
    name: string;
    employeeNumber: string;
    email: string;
    positionId: string;
    positionTitle: string;
}
