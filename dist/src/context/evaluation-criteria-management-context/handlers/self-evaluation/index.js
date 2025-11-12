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
exports.SELF_EVALUATION_HANDLERS = exports.SELF_EVALUATION_QUERY_HANDLERS = exports.SELF_EVALUATION_COMMAND_HANDLERS = void 0;
__exportStar(require("./commands/reset-all-self-evaluations.handler"), exports);
const reset_all_self_evaluations_handler_1 = require("./commands/reset-all-self-evaluations.handler");
exports.SELF_EVALUATION_COMMAND_HANDLERS = [
    reset_all_self_evaluations_handler_1.ResetAllSelfEvaluationsHandler,
];
exports.SELF_EVALUATION_QUERY_HANDLERS = [];
exports.SELF_EVALUATION_HANDLERS = [
    ...exports.SELF_EVALUATION_COMMAND_HANDLERS,
    ...exports.SELF_EVALUATION_QUERY_HANDLERS,
];
//# sourceMappingURL=index.js.map