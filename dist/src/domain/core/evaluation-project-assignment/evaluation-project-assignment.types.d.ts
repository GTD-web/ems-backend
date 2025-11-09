export interface EvaluationProjectAssignmentDto {
    id: string;
    periodId: string;
    employeeId: string;
    projectId: string;
    assignedDate: Date;
    assignedBy: string;
    displayOrder: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    createdBy?: string;
    updatedBy?: string;
    version: number;
    periodName?: string;
    employeeName?: string;
    projectName?: string;
    assignedByName?: string;
}
export interface EvaluationProjectAssignmentDetailDto {
    id: string;
    assignedDate: Date;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    createdBy?: string;
    updatedBy?: string;
    version: number;
    evaluationPeriod?: {
        id: string;
        name: string;
        startDate: Date;
        endDate?: Date;
        status: string;
        description?: string;
    } | null;
    employee?: {
        id: string;
        employeeNumber: string;
        name: string;
        email?: string;
        phoneNumber?: string;
        status: string;
        departmentId?: string;
        departmentName?: string;
    } | null;
    project?: {
        id: string;
        name: string;
        projectCode: string;
        status: string;
        startDate?: Date;
        endDate?: Date;
        managerId?: string;
    } | null;
    assignedBy?: {
        id: string;
        employeeNumber: string;
        name: string;
        email?: string;
        departmentId?: string;
        departmentName?: string;
    } | null;
}
export interface CreateEvaluationProjectAssignmentData {
    periodId: string;
    employeeId: string;
    projectId: string;
    assignedBy: string;
    displayOrder?: number;
}
export interface UpdateEvaluationProjectAssignmentData {
    projectId?: string;
    assignedBy?: string;
    displayOrder?: number;
}
export interface EvaluationProjectAssignmentFilter {
    periodId?: string;
    employeeId?: string;
    projectId?: string;
    assignedBy?: string;
    assignedDateFrom?: Date;
    assignedDateTo?: Date;
    page?: number;
    limit?: number;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
}
export declare enum OrderDirection {
    UP = "up",
    DOWN = "down"
}
export interface ChangeProjectAssignmentOrderData {
    assignmentId: string;
    direction: OrderDirection;
    updatedBy: string;
}
export interface ReorderProjectAssignmentsData {
    periodId: string;
    employeeId: string;
    updatedBy: string;
}
