import { WbsItemStatus } from './wbs-item.types';
export interface IWbsItem {
    readonly id: string;
    readonly wbsCode: string;
    readonly title: string;
    readonly status: WbsItemStatus;
    readonly startDate?: Date;
    readonly endDate?: Date;
    readonly progressPercentage?: number;
    readonly assignedToId?: string;
    readonly projectId: string;
    readonly parentWbsId?: string;
    readonly level: number;
}
