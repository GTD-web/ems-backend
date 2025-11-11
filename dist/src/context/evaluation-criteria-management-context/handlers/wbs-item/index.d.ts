export { CreateWbsItemCommand, CreateWbsItemHandler, type CreateWbsItemResult, } from './commands/create-wbs-item.handler';
export { UpdateWbsItemCommand, UpdateWbsItemHandler, type UpdateWbsItemResult, } from './commands/update-wbs-item.handler';
export { GetWbsItemsByProjectQuery, GetWbsItemsByProjectHandler, type GetWbsItemsByProjectResult, } from './queries/get-wbs-items-by-project.handler';
import { CreateWbsItemHandler } from './commands/create-wbs-item.handler';
import { UpdateWbsItemHandler } from './commands/update-wbs-item.handler';
import { GetWbsItemsByProjectHandler } from './queries/get-wbs-items-by-project.handler';
export declare const WBS_ITEM_COMMAND_HANDLERS: (typeof CreateWbsItemHandler | typeof UpdateWbsItemHandler)[];
export declare const WBS_ITEM_QUERY_HANDLERS: (typeof GetWbsItemsByProjectHandler)[];
export declare const WBS_ITEM_HANDLERS: (typeof CreateWbsItemHandler | typeof UpdateWbsItemHandler | typeof GetWbsItemsByProjectHandler)[];
