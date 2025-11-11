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
exports.QUERY_HANDLERS = exports.COMMAND_HANDLERS = void 0;
__exportStar(require("./evaluation-period"), exports);
__exportStar(require("./evaluation-target"), exports);
__exportStar(require("./evaluation-target/commands/register-evaluation-target-with-auto-evaluator.handler"), exports);
const evaluation_period_1 = require("./evaluation-period");
const evaluation_target_1 = require("./evaluation-target");
exports.COMMAND_HANDLERS = [
    ...evaluation_period_1.EVALUATION_PERIOD_COMMAND_HANDLERS,
    ...evaluation_target_1.EVALUATION_TARGET_COMMAND_HANDLERS,
];
exports.QUERY_HANDLERS = [
    ...evaluation_period_1.EVALUATION_PERIOD_QUERY_HANDLERS,
    ...evaluation_target_1.EVALUATION_TARGET_QUERY_HANDLERS,
];
//# sourceMappingURL=index.js.map