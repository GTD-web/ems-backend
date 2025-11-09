export interface DepartmentDto {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    createdBy?: string;
    updatedBy?: string;
    version: number;
    name: string;
    code: string;
    order: number;
    managerId?: string;
    parentDepartmentId?: string;
    externalId: string;
    externalCreatedAt: Date;
    externalUpdatedAt: Date;
    lastSyncAt?: Date;
    managerName?: string;
    parentDepartmentName?: string;
    childDepartmentCount?: number;
    employeeCount?: number;
    readonly isDeleted: boolean;
    readonly isNew: boolean;
    readonly isRootDepartment: boolean;
    readonly hasChildren: boolean;
    readonly needsSync: boolean;
}
export interface CreateDepartmentDto {
    name: string;
    code: string;
    externalId: string;
    order?: number;
    managerId?: string;
    parentDepartmentId?: string;
    externalCreatedAt: Date;
    externalUpdatedAt: Date;
}
export interface UpdateDepartmentDto {
    name?: string;
    code?: string;
    order?: number;
    managerId?: string;
    parentDepartmentId?: string;
    externalUpdatedAt?: Date;
    lastSyncAt?: Date;
}
export interface DepartmentFilter {
    name?: string;
    code?: string;
    managerId?: string;
    parentDepartmentId?: string;
    externalId?: string;
}
export interface DepartmentStatistics {
    totalDepartments: number;
    rootDepartments: number;
    subDepartments: number;
    employeesByDepartment: Record<string, number>;
    averageEmployeesPerDepartment: number;
    lastSyncAt?: Date;
}
export interface DepartmentListOptions {
    page?: number;
    limit?: number;
    sortBy?: 'name' | 'code' | 'order' | 'createdAt';
    sortOrder?: 'ASC' | 'DESC';
    filter?: DepartmentFilter;
}
export interface DepartmentSyncResult {
    success: boolean;
    totalProcessed: number;
    created: number;
    updated: number;
    errors: string[];
    syncedAt: Date;
}
