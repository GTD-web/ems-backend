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
exports.EVALUATION_PERIOD_QUERY_HANDLERS = void 0;
__exportStar(require("./get-active-evaluation-periods.handler"), exports);
__exportStar(require("./get-evaluation-period-detail.handler"), exports);
__exportStar(require("./get-evaluation-period-list.handler"), exports);
const get_active_evaluation_periods_handler_1 = require("./get-active-evaluation-periods.handler");
const get_evaluation_period_detail_handler_1 = require("./get-evaluation-period-detail.handler");
const get_evaluation_period_list_handler_1 = require("./get-evaluation-period-list.handler");
exports.EVALUATION_PERIOD_QUERY_HANDLERS = [
    get_active_evaluation_periods_handler_1.GetActiveEvaluationPeriodsQueryHandler,
    get_evaluation_period_detail_handler_1.GetEvaluationPeriodDetailQueryHandler,
    get_evaluation_period_list_handler_1.GetEvaluationPeriodListQueryHandler,
];
//# sourceMappingURL=index.js.map