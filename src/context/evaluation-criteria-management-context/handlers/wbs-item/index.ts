// Commands
export {
  CreateWbsItemCommand,
  CreateWbsItemHandler,
  type CreateWbsItemResult,
} from './commands/create-wbs-item.handler';

export {
  UpdateWbsItemCommand,
  UpdateWbsItemHandler,
  type UpdateWbsItemResult,
} from './commands/update-wbs-item.handler';

// Queries
export {
  GetWbsItemsByProjectQuery,
  GetWbsItemsByProjectHandler,
  type GetWbsItemsByProjectResult,
} from './queries/get-wbs-items-by-project.handler';

// Handler 배열 export (Module에서 사용)
import { CreateWbsItemHandler } from './commands/create-wbs-item.handler';
import { UpdateWbsItemHandler } from './commands/update-wbs-item.handler';
import { GetWbsItemsByProjectHandler } from './queries/get-wbs-items-by-project.handler';

export const WBS_ITEM_COMMAND_HANDLERS = [
  CreateWbsItemHandler,
  UpdateWbsItemHandler,
];

export const WBS_ITEM_QUERY_HANDLERS = [
  GetWbsItemsByProjectHandler,
];

export const WBS_ITEM_HANDLERS = [
  ...WBS_ITEM_COMMAND_HANDLERS,
  ...WBS_ITEM_QUERY_HANDLERS,
];
