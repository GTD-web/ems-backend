export declare class ExcludeEmployeeFromListDto {
    excludeReason: string;
}
export declare class IncludeEmployeeInListDto {
}
export declare class GetEmployeesQueryDto {
    includeExcluded?: boolean;
    departmentId?: string;
}
export declare class GetPartLeadersQueryDto {
    forceRefresh?: boolean;
}
export declare class EmployeeResponseDto {
    id: string;
    employeeNumber: string;
    name: string;
    email: string;
    rankName?: string;
    rankCode?: string;
    rankLevel?: number;
    departmentName?: string;
    departmentCode?: string;
    isActive: boolean;
    isExcludedFromList: boolean;
    excludeReason?: string;
    excludedBy?: string;
    excludedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare class PartLeadersResponseDto {
    partLeaders: EmployeeResponseDto[];
    count: number;
}
