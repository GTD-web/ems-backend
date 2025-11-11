import { ICommandHandler } from '@nestjs/cqrs';
import { WbsItemService } from '../../../../../domain/common/wbs-item/wbs-item.service';
import { WbsItemStatus } from '../../../../../domain/common/wbs-item/wbs-item.types';
import type { WbsItemDto } from '../../../../../domain/common/wbs-item/wbs-item.types';
export declare class UpdateWbsItemCommand {
    readonly id: string;
    readonly data: {
        title?: string;
        status?: WbsItemStatus;
        startDate?: Date;
        endDate?: Date;
        progressPercentage?: number;
    };
    readonly updatedBy: string;
    constructor(id: string, data: {
        title?: string;
        status?: WbsItemStatus;
        startDate?: Date;
        endDate?: Date;
        progressPercentage?: number;
    }, updatedBy: string);
}
export interface UpdateWbsItemResult {
    wbsItem: WbsItemDto;
}
export declare class UpdateWbsItemHandler implements ICommandHandler<UpdateWbsItemCommand, UpdateWbsItemResult> {
    private readonly wbsItemService;
    private readonly logger;
    constructor(wbsItemService: WbsItemService);
    execute(command: UpdateWbsItemCommand): Promise<UpdateWbsItemResult>;
}
