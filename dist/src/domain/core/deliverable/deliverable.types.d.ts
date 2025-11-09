export declare enum DeliverableType {
    DOCUMENT = "document",
    CODE = "code",
    DESIGN = "design",
    REPORT = "report",
    PRESENTATION = "presentation",
    OTHER = "other"
}
export interface CreateDeliverableData {
    name: string;
    description?: string;
    type: DeliverableType;
    filePath?: string;
    employeeId?: string;
    wbsItemId?: string;
    mappedBy?: string;
    mappedDate?: Date;
    isActive?: boolean;
    createdBy: string;
}
export interface UpdateDeliverableData {
    name?: string;
    description?: string;
    type?: DeliverableType;
    filePath?: string;
    employeeId?: string;
    wbsItemId?: string;
    isActive?: boolean;
}
export interface DeliverableDto {
    id: string;
    name: string;
    description?: string;
    type: DeliverableType;
    filePath?: string;
    employeeId?: string;
    wbsItemId?: string;
    mappedDate?: Date;
    mappedBy?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    createdBy?: string;
    updatedBy?: string;
    version: number;
}
export interface DeliverableFilter {
    type?: DeliverableType;
    employeeId?: string;
    wbsItemId?: string;
    mappedBy?: string;
    activeOnly?: boolean;
    inactiveOnly?: boolean;
    mappedDateFrom?: Date;
    mappedDateTo?: Date;
    page?: number;
    limit?: number;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
}
export interface DeliverableStatistics {
    totalDeliverables: number;
    typeCounts: Record<DeliverableType, number>;
    activeDeliverables: number;
    inactiveDeliverables: number;
    deliverablesByWbsItem: Record<string, number>;
    deliverablesByEmployee: Record<string, number>;
}
