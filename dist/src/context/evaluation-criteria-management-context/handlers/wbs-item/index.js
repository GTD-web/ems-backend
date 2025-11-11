"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WBS_ITEM_HANDLERS = exports.WBS_ITEM_QUERY_HANDLERS = exports.WBS_ITEM_COMMAND_HANDLERS = exports.GetWbsItemsByProjectHandler = exports.GetWbsItemsByProjectQuery = exports.UpdateWbsItemHandler = exports.UpdateWbsItemCommand = exports.CreateWbsItemHandler = exports.CreateWbsItemCommand = void 0;
var create_wbs_item_handler_1 = require("./commands/create-wbs-item.handler");
Object.defineProperty(exports, "CreateWbsItemCommand", { enumerable: true, get: function () { return create_wbs_item_handler_1.CreateWbsItemCommand; } });
Object.defineProperty(exports, "CreateWbsItemHandler", { enumerable: true, get: function () { return create_wbs_item_handler_1.CreateWbsItemHandler; } });
var update_wbs_item_handler_1 = require("./commands/update-wbs-item.handler");
Object.defineProperty(exports, "UpdateWbsItemCommand", { enumerable: true, get: function () { return update_wbs_item_handler_1.UpdateWbsItemCommand; } });
Object.defineProperty(exports, "UpdateWbsItemHandler", { enumerable: true, get: function () { return update_wbs_item_handler_1.UpdateWbsItemHandler; } });
var get_wbs_items_by_project_handler_1 = require("./queries/get-wbs-items-by-project.handler");
Object.defineProperty(exports, "GetWbsItemsByProjectQuery", { enumerable: true, get: function () { return get_wbs_items_by_project_handler_1.GetWbsItemsByProjectQuery; } });
Object.defineProperty(exports, "GetWbsItemsByProjectHandler", { enumerable: true, get: function () { return get_wbs_items_by_project_handler_1.GetWbsItemsByProjectHandler; } });
const create_wbs_item_handler_2 = require("./commands/create-wbs-item.handler");
const update_wbs_item_handler_2 = require("./commands/update-wbs-item.handler");
const get_wbs_items_by_project_handler_2 = require("./queries/get-wbs-items-by-project.handler");
exports.WBS_ITEM_COMMAND_HANDLERS = [
    create_wbs_item_handler_2.CreateWbsItemHandler,
    update_wbs_item_handler_2.UpdateWbsItemHandler,
];
exports.WBS_ITEM_QUERY_HANDLERS = [
    get_wbs_items_by_project_handler_2.GetWbsItemsByProjectHandler,
];
exports.WBS_ITEM_HANDLERS = [
    ...exports.WBS_ITEM_COMMAND_HANDLERS,
    ...exports.WBS_ITEM_QUERY_HANDLERS,
];
//# sourceMappingURL=index.js.map