export declare enum WbsItemStatus {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED",
    ON_HOLD = "ON_HOLD"
}
export interface WbsItemDto {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    wbsCode: string;
    title: string;
    status: WbsItemStatus;
    startDate?: Date;
    endDate?: Date;
    progressPercentage?: number;
    assignedToId?: string;
    projectId: string;
    parentWbsId?: string;
    level: number;
    assigneeName?: string;
    projectName?: string;
    parentWbsTitle?: string;
    readonly isDeleted: boolean;
    readonly isInProgress: boolean;
    readonly isCompleted: boolean;
    readonly isCancelled: boolean;
    readonly isPending: boolean;
    readonly isOverdue: boolean;
}
export interface CreateWbsItemDto {
    wbsCode: string;
    title: string;
    status: WbsItemStatus;
    startDate?: Date;
    endDate?: Date;
    progressPercentage?: number;
    assignedToId?: string;
    projectId: string;
    parentWbsId?: string;
    level: number;
}
export interface UpdateWbsItemDto {
    wbsCode?: string;
    title?: string;
    status?: WbsItemStatus;
    startDate?: Date;
    endDate?: Date;
    progressPercentage?: number;
    assignedToId?: string;
    projectId?: string;
    parentWbsId?: string;
    level?: number;
}
export interface WbsItemFilter {
    status?: WbsItemStatus;
    assignedToId?: string;
    projectId?: string;
    parentWbsId?: string;
    level?: number;
    startDateFrom?: Date;
    startDateTo?: Date;
    endDateFrom?: Date;
    endDateTo?: Date;
    progressMin?: number;
    progressMax?: number;
}
export interface WbsItemStatistics {
    totalWbsItems: number;
    pendingWbsItems: number;
    inProgressWbsItems: number;
    completedWbsItems: number;
    cancelledWbsItems: number;
    onHoldWbsItems: number;
    wbsItemsByStatus: Record<string, number>;
    wbsItemsByProject: Record<string, number>;
    wbsItemsByAssignee: Record<string, number>;
    wbsItemsByLevel: Record<string, number>;
    averageProgressPercentage: number;
    lastSyncAt?: Date;
}
export interface WbsItemListOptions {
    page?: number;
    limit?: number;
    sortBy?: 'wbsCode' | 'title' | 'startDate' | 'endDate' | 'progressPercentage' | 'createdAt';
    sortOrder?: 'ASC' | 'DESC';
    filter?: WbsItemFilter;
}
export interface WbsTreeNode {
    wbsItem: WbsItemDto;
    children: WbsTreeNode[];
    depth: number;
    hasChildren: boolean;
    isExpanded?: boolean;
}
