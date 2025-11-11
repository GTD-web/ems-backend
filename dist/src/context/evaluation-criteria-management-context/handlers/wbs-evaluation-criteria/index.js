"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WBS_EVALUATION_CRITERIA_HANDLERS = exports.WBS_EVALUATION_CRITERIA_QUERY_HANDLERS = exports.WBS_EVALUATION_CRITERIA_COMMAND_HANDLERS = exports.GetWbsItemEvaluationCriteriaHandler = exports.GetWbsItemEvaluationCriteriaQuery = exports.GetWbsEvaluationCriteriaDetailHandler = exports.GetWbsEvaluationCriteriaDetailQuery = exports.GetWbsEvaluationCriteriaListHandler = exports.GetWbsEvaluationCriteriaListQuery = exports.DeleteAllWbsEvaluationCriteriaHandler = exports.DeleteAllWbsEvaluationCriteriaCommand = exports.DeleteWbsItemEvaluationCriteriaHandler = exports.DeleteWbsItemEvaluationCriteriaCommand = exports.DeleteWbsEvaluationCriteriaHandler = exports.DeleteWbsEvaluationCriteriaCommand = exports.UpdateWbsEvaluationCriteriaHandler = exports.UpdateWbsEvaluationCriteriaCommand = exports.CreateWbsEvaluationCriteriaHandler = exports.CreateWbsEvaluationCriteriaCommand = void 0;
var create_wbs_evaluation_criteria_handler_1 = require("./commands/create-wbs-evaluation-criteria.handler");
Object.defineProperty(exports, "CreateWbsEvaluationCriteriaCommand", { enumerable: true, get: function () { return create_wbs_evaluation_criteria_handler_1.CreateWbsEvaluationCriteriaCommand; } });
Object.defineProperty(exports, "CreateWbsEvaluationCriteriaHandler", { enumerable: true, get: function () { return create_wbs_evaluation_criteria_handler_1.CreateWbsEvaluationCriteriaHandler; } });
var update_wbs_evaluation_criteria_handler_1 = require("./commands/update-wbs-evaluation-criteria.handler");
Object.defineProperty(exports, "UpdateWbsEvaluationCriteriaCommand", { enumerable: true, get: function () { return update_wbs_evaluation_criteria_handler_1.UpdateWbsEvaluationCriteriaCommand; } });
Object.defineProperty(exports, "UpdateWbsEvaluationCriteriaHandler", { enumerable: true, get: function () { return update_wbs_evaluation_criteria_handler_1.UpdateWbsEvaluationCriteriaHandler; } });
var delete_wbs_evaluation_criteria_handler_1 = require("./commands/delete-wbs-evaluation-criteria.handler");
Object.defineProperty(exports, "DeleteWbsEvaluationCriteriaCommand", { enumerable: true, get: function () { return delete_wbs_evaluation_criteria_handler_1.DeleteWbsEvaluationCriteriaCommand; } });
Object.defineProperty(exports, "DeleteWbsEvaluationCriteriaHandler", { enumerable: true, get: function () { return delete_wbs_evaluation_criteria_handler_1.DeleteWbsEvaluationCriteriaHandler; } });
var delete_wbs_item_evaluation_criteria_handler_1 = require("./commands/delete-wbs-item-evaluation-criteria.handler");
Object.defineProperty(exports, "DeleteWbsItemEvaluationCriteriaCommand", { enumerable: true, get: function () { return delete_wbs_item_evaluation_criteria_handler_1.DeleteWbsItemEvaluationCriteriaCommand; } });
Object.defineProperty(exports, "DeleteWbsItemEvaluationCriteriaHandler", { enumerable: true, get: function () { return delete_wbs_item_evaluation_criteria_handler_1.DeleteWbsItemEvaluationCriteriaHandler; } });
var delete_all_wbs_evaluation_criteria_handler_1 = require("./commands/delete-all-wbs-evaluation-criteria.handler");
Object.defineProperty(exports, "DeleteAllWbsEvaluationCriteriaCommand", { enumerable: true, get: function () { return delete_all_wbs_evaluation_criteria_handler_1.DeleteAllWbsEvaluationCriteriaCommand; } });
Object.defineProperty(exports, "DeleteAllWbsEvaluationCriteriaHandler", { enumerable: true, get: function () { return delete_all_wbs_evaluation_criteria_handler_1.DeleteAllWbsEvaluationCriteriaHandler; } });
var get_wbs_evaluation_criteria_list_handler_1 = require("./queries/get-wbs-evaluation-criteria-list.handler");
Object.defineProperty(exports, "GetWbsEvaluationCriteriaListQuery", { enumerable: true, get: function () { return get_wbs_evaluation_criteria_list_handler_1.GetWbsEvaluationCriteriaListQuery; } });
Object.defineProperty(exports, "GetWbsEvaluationCriteriaListHandler", { enumerable: true, get: function () { return get_wbs_evaluation_criteria_list_handler_1.GetWbsEvaluationCriteriaListHandler; } });
var get_wbs_evaluation_criteria_detail_handler_1 = require("./queries/get-wbs-evaluation-criteria-detail.handler");
Object.defineProperty(exports, "GetWbsEvaluationCriteriaDetailQuery", { enumerable: true, get: function () { return get_wbs_evaluation_criteria_detail_handler_1.GetWbsEvaluationCriteriaDetailQuery; } });
Object.defineProperty(exports, "GetWbsEvaluationCriteriaDetailHandler", { enumerable: true, get: function () { return get_wbs_evaluation_criteria_detail_handler_1.GetWbsEvaluationCriteriaDetailHandler; } });
var get_wbs_item_evaluation_criteria_handler_1 = require("./queries/get-wbs-item-evaluation-criteria.handler");
Object.defineProperty(exports, "GetWbsItemEvaluationCriteriaQuery", { enumerable: true, get: function () { return get_wbs_item_evaluation_criteria_handler_1.GetWbsItemEvaluationCriteriaQuery; } });
Object.defineProperty(exports, "GetWbsItemEvaluationCriteriaHandler", { enumerable: true, get: function () { return get_wbs_item_evaluation_criteria_handler_1.GetWbsItemEvaluationCriteriaHandler; } });
const create_wbs_evaluation_criteria_handler_2 = require("./commands/create-wbs-evaluation-criteria.handler");
const update_wbs_evaluation_criteria_handler_2 = require("./commands/update-wbs-evaluation-criteria.handler");
const delete_wbs_evaluation_criteria_handler_2 = require("./commands/delete-wbs-evaluation-criteria.handler");
const delete_wbs_item_evaluation_criteria_handler_2 = require("./commands/delete-wbs-item-evaluation-criteria.handler");
const delete_all_wbs_evaluation_criteria_handler_2 = require("./commands/delete-all-wbs-evaluation-criteria.handler");
const get_wbs_evaluation_criteria_list_handler_2 = require("./queries/get-wbs-evaluation-criteria-list.handler");
const get_wbs_evaluation_criteria_detail_handler_2 = require("./queries/get-wbs-evaluation-criteria-detail.handler");
const get_wbs_item_evaluation_criteria_handler_2 = require("./queries/get-wbs-item-evaluation-criteria.handler");
exports.WBS_EVALUATION_CRITERIA_COMMAND_HANDLERS = [
    create_wbs_evaluation_criteria_handler_2.CreateWbsEvaluationCriteriaHandler,
    update_wbs_evaluation_criteria_handler_2.UpdateWbsEvaluationCriteriaHandler,
    delete_wbs_evaluation_criteria_handler_2.DeleteWbsEvaluationCriteriaHandler,
    delete_wbs_item_evaluation_criteria_handler_2.DeleteWbsItemEvaluationCriteriaHandler,
    delete_all_wbs_evaluation_criteria_handler_2.DeleteAllWbsEvaluationCriteriaHandler,
];
exports.WBS_EVALUATION_CRITERIA_QUERY_HANDLERS = [
    get_wbs_evaluation_criteria_list_handler_2.GetWbsEvaluationCriteriaListHandler,
    get_wbs_evaluation_criteria_detail_handler_2.GetWbsEvaluationCriteriaDetailHandler,
    get_wbs_item_evaluation_criteria_handler_2.GetWbsItemEvaluationCriteriaHandler,
];
exports.WBS_EVALUATION_CRITERIA_HANDLERS = [
    ...exports.WBS_EVALUATION_CRITERIA_COMMAND_HANDLERS,
    ...exports.WBS_EVALUATION_CRITERIA_QUERY_HANDLERS,
];
//# sourceMappingURL=index.js.map