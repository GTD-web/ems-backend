import { BaseEntity } from '@libs/database/base/base.entity';
import { WbsItemStatus, WbsItemDto, CreateWbsItemDto, UpdateWbsItemDto } from './wbs-item.types';
import { IWbsItem } from './wbs-item.interface';
export declare class WbsItem extends BaseEntity<WbsItemDto> implements IWbsItem {
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
    constructor(wbsCode?: string, title?: string, status?: WbsItemStatus, startDate?: Date, endDate?: Date, progressPercentage?: number, assignedToId?: string, projectId?: string, parentWbsId?: string, level?: number);
    DTO로_변환한다(): WbsItemDto;
    static 생성한다(data: CreateWbsItemDto, createdBy: string): WbsItem;
    업데이트한다(data: UpdateWbsItemDto, updatedBy: string): void;
    삭제한다(deletedBy: string): void;
}
