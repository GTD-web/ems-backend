import type { DeliverableType } from '../deliverable.types';
export interface IDeliverable {
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
