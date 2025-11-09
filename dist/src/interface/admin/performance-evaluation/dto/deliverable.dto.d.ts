import { DeliverableType } from '@domain/core/deliverable/deliverable.types';
export declare class CreateDeliverableDto {
    name: string;
    description?: string;
    type: DeliverableType;
    filePath?: string;
    employeeId: string;
    wbsItemId: string;
    createdBy?: string;
}
export declare class UpdateDeliverableDto {
    name?: string;
    description?: string;
    type?: DeliverableType;
    filePath?: string;
    employeeId?: string;
    wbsItemId?: string;
    isActive?: boolean;
    updatedBy?: string;
}
export declare class BulkCreateDeliverablesDto {
    deliverables: any[];
}
export declare class BulkDeleteDeliverablesDto {
    deliverableIds: string[];
}
export declare class DeliverableResponseDto {
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
export declare class DeliverableListResponseDto {
    deliverables: DeliverableResponseDto[];
    total: number;
}
export declare class BulkCreateResultDto {
    successCount: number;
    failedCount: number;
    createdIds: string[];
    failedItems: Array<{
        data: Partial<CreateDeliverableDto>;
        error: string;
    }>;
}
export declare class BulkDeleteResultDto {
    successCount: number;
    failedCount: number;
    failedIds: Array<{
        id: string;
        error: string;
    }>;
}
export declare class DeliverableFilterDto {
    type?: DeliverableType;
    employeeId?: string;
    wbsItemId?: string;
    activeOnly?: boolean;
}
export declare class GetDeliverablesQueryDto {
    activeOnly?: boolean;
}
