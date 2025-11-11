export type EmployeeGender = 'MALE' | 'FEMALE';
export type EmployeeStatus = '재직중' | '휴직중' | '퇴사';
export interface EmployeeDto {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    createdBy?: string;
    updatedBy?: string;
    version: number;
    employeeNumber: string;
    name: string;
    email: string;
    phoneNumber?: string;
    dateOfBirth?: Date;
    gender?: EmployeeGender;
    hireDate?: Date;
    managerId?: string;
    status: EmployeeStatus;
    departmentId?: string;
    departmentName?: string;
    departmentCode?: string;
    positionId?: string;
    rankId?: string;
    rankName?: string;
    rankCode?: string;
    rankLevel?: number;
    externalId: string;
    externalCreatedAt: Date;
    externalUpdatedAt: Date;
    lastSyncAt?: Date;
    roles?: string[];
    isExcludedFromList: boolean;
    excludeReason?: string | null;
    excludedBy?: string | null;
    excludedAt?: Date | null;
    positionName?: string;
    managerName?: string;
    readonly isDeleted: boolean;
    readonly isNew: boolean;
    readonly isActive: boolean;
    readonly isOnLeave: boolean;
    readonly isResigned: boolean;
    readonly isMale: boolean;
    readonly isFemale: boolean;
    readonly yearsOfService: number;
    readonly needsSync: boolean;
}
export interface ExternalPositionData {
    _id: string;
    position_title: string;
    position_code: string;
    level: number;
}
export interface ExternalRankData {
    _id: string;
    rank_name: string;
    rank_code: string;
    level: number;
    description?: string;
    created_at?: string;
    updated_at?: string;
    id?: string;
}
export interface ExternalDepartmentData {
    _id: string;
    department_name: string;
    department_code: string;
    order: number;
    parent_department_id: string;
}
export interface ExternalEmployeeData {
    _id: string;
    employee_number: string;
    name: string;
    email: string;
    phone_number: string;
    date_of_birth: string;
    gender: EmployeeGender;
    hire_date: string;
    manager_id: string | null;
    status: EmployeeStatus;
    department_history: any[];
    position_history: any[];
    rank_history: any[];
    created_at: string;
    updated_at: string;
    __v: number;
    position: ExternalPositionData;
    rank: ExternalRankData;
    department: ExternalDepartmentData;
}
export interface CreateEmployeeDto {
    employeeNumber: string;
    name: string;
    email: string;
    phoneNumber?: string;
    dateOfBirth?: Date;
    gender?: EmployeeGender;
    hireDate?: Date;
    managerId?: string;
    status: EmployeeStatus;
    departmentId?: string;
    departmentName?: string;
    departmentCode?: string;
    positionId?: string;
    rankId?: string;
    rankName?: string;
    rankCode?: string;
    rankLevel?: number;
    externalId: string;
    externalCreatedAt: Date;
    externalUpdatedAt: Date;
    roles?: string[];
}
export interface UpdateEmployeeDto {
    name?: string;
    email?: string;
    phoneNumber?: string;
    dateOfBirth?: Date;
    gender?: EmployeeGender;
    hireDate?: Date;
    managerId?: string;
    status?: EmployeeStatus;
    departmentId?: string;
    departmentName?: string;
    departmentCode?: string;
    positionId?: string;
    rankId?: string;
    rankName?: string;
    rankCode?: string;
    rankLevel?: number;
    externalUpdatedAt?: Date;
    lastSyncAt?: Date;
    roles?: string[];
    isExcludedFromList?: boolean;
    excludeReason?: string | null;
    excludedBy?: string | null;
    excludedAt?: Date | null;
}
export interface EmployeeSyncResult {
    success: boolean;
    totalProcessed: number;
    created: number;
    updated: number;
    errors: string[];
    syncedAt: Date;
}
export interface EmployeeFilter {
    departmentId?: string;
    positionId?: string;
    rankId?: string;
    status?: EmployeeStatus;
    gender?: EmployeeGender;
    managerId?: string;
    includeExcluded?: boolean;
}
export interface EmployeeStatistics {
    totalEmployees: number;
    activeEmployees: number;
    onLeaveEmployees: number;
    resignedEmployees: number;
    employeesByDepartment: Record<string, number>;
    employeesByPosition: Record<string, number>;
    employeesByRank: Record<string, number>;
    employeesByGender: Record<string, number>;
    employeesByStatus: Record<string, number>;
    lastSyncAt?: Date;
}
export interface EmployeeListOptions {
    page?: number;
    limit?: number;
    sortBy?: 'name' | 'employeeNumber' | 'hireDate' | 'createdAt';
    sortOrder?: 'ASC' | 'DESC';
    filter?: EmployeeFilter;
}
