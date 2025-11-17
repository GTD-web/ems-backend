export declare class DepartmentHierarchyResponseDto {
    id: string;
    name: string;
    code: string;
    order: number;
    parentDepartmentId: string | null;
    level: number;
    depth: number;
    childrenCount: number;
    totalDescendants: number;
    subDepartments: DepartmentHierarchyResponseDto[];
}
export declare class EmployeeSummaryDto {
    id: string;
    employeeNumber: string;
    name: string;
    email: string;
    rankName: string | null;
    rankCode: string | null;
    rankLevel: number | null;
    isActive: boolean;
}
export declare class DepartmentHierarchyWithEmployeesResponseDto {
    id: string;
    name: string;
    code: string;
    order: number;
    parentDepartmentId: string | null;
    level: number;
    depth: number;
    childrenCount: number;
    totalDescendants: number;
    employeeCount: number;
    employees: EmployeeSummaryDto[];
    subDepartments: DepartmentHierarchyWithEmployeesResponseDto[];
}
