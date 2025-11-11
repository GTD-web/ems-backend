import { IQueryHandler } from '@nestjs/cqrs';
import { WbsItemService } from '../../../../../domain/common/wbs-item/wbs-item.service';
import type { WbsItemDto } from '../../../../../domain/common/wbs-item/wbs-item.types';
export declare class GetWbsItemsByProjectQuery {
    readonly projectId: string;
    constructor(projectId: string);
}
export interface GetWbsItemsByProjectResult {
    wbsItems: WbsItemDto[];
}
export declare class GetWbsItemsByProjectHandler implements IQueryHandler<GetWbsItemsByProjectQuery, GetWbsItemsByProjectResult> {
    private readonly wbsItemService;
    private readonly logger;
    constructor(wbsItemService: WbsItemService);
    execute(query: GetWbsItemsByProjectQuery): Promise<GetWbsItemsByProjectResult>;
}
