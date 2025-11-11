"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EVALUATION_TARGET_COMMAND_HANDLERS = void 0;
__exportStar(require("./register-evaluation-target.handler"), exports);
__exportStar(require("./register-bulk-evaluation-targets.handler"), exports);
__exportStar(require("./exclude-evaluation-target.handler"), exports);
__exportStar(require("./include-evaluation-target.handler"), exports);
__exportStar(require("./unregister-evaluation-target.handler"), exports);
__exportStar(require("./unregister-all-evaluation-targets.handler"), exports);
__exportStar(require("./register-evaluation-target-with-auto-evaluator.handler"), exports);
const register_evaluation_target_handler_1 = require("./register-evaluation-target.handler");
const register_bulk_evaluation_targets_handler_1 = require("./register-bulk-evaluation-targets.handler");
const exclude_evaluation_target_handler_1 = require("./exclude-evaluation-target.handler");
const include_evaluation_target_handler_1 = require("./include-evaluation-target.handler");
const unregister_evaluation_target_handler_1 = require("./unregister-evaluation-target.handler");
const unregister_all_evaluation_targets_handler_1 = require("./unregister-all-evaluation-targets.handler");
const register_evaluation_target_with_auto_evaluator_handler_1 = require("./register-evaluation-target-with-auto-evaluator.handler");
exports.EVALUATION_TARGET_COMMAND_HANDLERS = [
    register_evaluation_target_handler_1.RegisterEvaluationTargetHandler,
    register_bulk_evaluation_targets_handler_1.RegisterBulkEvaluationTargetsHandler,
    exclude_evaluation_target_handler_1.ExcludeEvaluationTargetHandler,
    include_evaluation_target_handler_1.IncludeEvaluationTargetHandler,
    unregister_evaluation_target_handler_1.UnregisterEvaluationTargetHandler,
    unregister_all_evaluation_targets_handler_1.UnregisterAllEvaluationTargetsHandler,
    register_evaluation_target_with_auto_evaluator_handler_1.RegisterEvaluationTargetWithAutoEvaluatorHandler,
];
//# sourceMappingURL=index.js.map