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
exports.EVALUATION_TARGET_QUERY_HANDLERS = void 0;
__exportStar(require("./get-evaluation-targets.handler"), exports);
__exportStar(require("./get-excluded-evaluation-targets.handler"), exports);
__exportStar(require("./get-employee-evaluation-periods.handler"), exports);
__exportStar(require("./check-evaluation-target.handler"), exports);
__exportStar(require("./get-evaluation-targets-by-filter.handler"), exports);
__exportStar(require("./get-unregistered-employees.handler"), exports);
const get_evaluation_targets_handler_1 = require("./get-evaluation-targets.handler");
const get_excluded_evaluation_targets_handler_1 = require("./get-excluded-evaluation-targets.handler");
const get_employee_evaluation_periods_handler_1 = require("./get-employee-evaluation-periods.handler");
const check_evaluation_target_handler_1 = require("./check-evaluation-target.handler");
const get_evaluation_targets_by_filter_handler_1 = require("./get-evaluation-targets-by-filter.handler");
const get_unregistered_employees_handler_1 = require("./get-unregistered-employees.handler");
exports.EVALUATION_TARGET_QUERY_HANDLERS = [
    get_evaluation_targets_handler_1.GetEvaluationTargetsHandler,
    get_excluded_evaluation_targets_handler_1.GetExcludedEvaluationTargetsHandler,
    get_employee_evaluation_periods_handler_1.GetEmployeeEvaluationPeriodsHandler,
    check_evaluation_target_handler_1.CheckEvaluationTargetHandler,
    get_evaluation_targets_by_filter_handler_1.GetEvaluationTargetsByFilterHandler,
    get_unregistered_employees_handler_1.GetUnregisteredEmployeesHandler,
];
//# sourceMappingURL=index.js.map