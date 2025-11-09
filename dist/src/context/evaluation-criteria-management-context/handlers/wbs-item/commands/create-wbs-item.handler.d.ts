import { ICommandHandler } from '@nestjs/cqrs';
import { WbsItemService } from '../../../../../domain/common/wbs-item/wbs-item.service';
import { WbsItemStatus } from '../../../../../domain/common/wbs-item/wbs-item.types';
import type { WbsItemDto } from '../../../../../domain/common/wbs-item/wbs-item.types';
export declare class CreateWbsItemCommand {
    readonly data: {
        wbsCode: string;
        title: string;
        status: WbsItemStatus;
        level: number;
        assignedToId?: string;
        projectId: string;
        parentWbsId?: string;
        startDate?: Date;
        endDate?: Date;
        progressPercentage?: number;
    };
    readonly createdBy: string;
    constructor(data: {
        wbsCode: string;
        title: string;
        status: WbsItemStatus;
        level: number;
        assignedToId?: string;
        projectId: string;
        parentWbsId?: string;
        startDate?: Date;
        endDate?: Date;
        progressPercentage?: number;
    }, createdBy: string);
}
export interface CreateWbsItemResult {
    wbsItem: WbsItemDto;
}
export declare class CreateWbsItemHandler implements ICommandHandler<CreateWbsItemCommand, CreateWbsItemResult> {
    private readonly wbsItemService;
    private readonly logger;
    constructor(wbsItemService: WbsItemService);
    execute(command: CreateWbsItemCommand): Promise<CreateWbsItemResult>;
}
