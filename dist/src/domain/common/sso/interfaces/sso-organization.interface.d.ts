export declare enum EmployeeStatus {
    ACTIVE = "\uC7AC\uC9C1\uC911",
    ON_LEAVE = "\uD734\uC9C1",
    TERMINATED = "\uD1F4\uC0AC"
}
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
    status?: EmployeeStatus;
    hireDate?: string;
    dateOfBirth?: string;
    gender?: string;
    department?: DepartmentInfo;
    position?: PositionInfo;
    jobTitle?: JobTitleInfo;
}
export interface DepartmentInfo {
    id: string;
    departmentCode: string;
    departmentName: string;
    parentDepartmentId?: string;
    type?: string;
    order?: number;
}
export interface PositionInfo {
    id: string;
    positionName: string;
    positionLevel: number;
    positionCode?: string;
    hasManagementAuthority?: boolean;
}
export interface JobTitleInfo {
    id: string;
    jobTitleName: string;
    jobTitleLevel: number;
    jobTitleCode?: string;
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
    type?: string;
    order?: number;
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
