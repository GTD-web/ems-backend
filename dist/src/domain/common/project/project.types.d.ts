export declare enum ProjectStatus {
    ACTIVE = "ACTIVE",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}
export interface ProjectDto {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    name: string;
    projectCode?: string;
    status: ProjectStatus;
    startDate?: Date;
    endDate?: Date;
    managerId?: string;
    managerName?: string;
    readonly isDeleted: boolean;
    readonly isActive: boolean;
    readonly isCompleted: boolean;
    readonly isCancelled: boolean;
}
export interface CreateProjectDto {
    name: string;
    projectCode?: string;
    status: ProjectStatus;
    startDate?: Date;
    endDate?: Date;
    managerId?: string;
}
export interface UpdateProjectDto {
    name?: string;
    projectCode?: string;
    status?: ProjectStatus;
    startDate?: Date;
    endDate?: Date;
    managerId?: string;
}
export interface ProjectFilter {
    status?: ProjectStatus;
    managerId?: string;
    startDateFrom?: Date;
    startDateTo?: Date;
    endDateFrom?: Date;
    endDateTo?: Date;
}
export interface ProjectStatistics {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    cancelledProjects: number;
    projectsByStatus: Record<string, number>;
    projectsByManager: Record<string, number>;
    lastSyncAt?: Date;
}
export interface ProjectListOptions {
    page?: number;
    limit?: number;
    sortBy?: 'name' | 'projectCode' | 'startDate' | 'endDate' | 'createdAt';
    sortOrder?: 'ASC' | 'DESC';
    filter?: ProjectFilter;
}
