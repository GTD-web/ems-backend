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
exports.EVALUATION_PERIOD_COMMAND_HANDLERS = void 0;
__exportStar(require("./create-evaluation-period.handler"), exports);
__exportStar(require("./start-evaluation-period.handler"), exports);
__exportStar(require("./complete-evaluation-period.handler"), exports);
__exportStar(require("./delete-evaluation-period.handler"), exports);
__exportStar(require("./update-evaluation-period-basic-info.handler"), exports);
__exportStar(require("./update-evaluation-period-schedule.handler"), exports);
__exportStar(require("./update-evaluation-setup-deadline.handler"), exports);
__exportStar(require("./update-performance-deadline.handler"), exports);
__exportStar(require("./update-self-evaluation-deadline.handler"), exports);
__exportStar(require("./update-peer-evaluation-deadline.handler"), exports);
__exportStar(require("./update-evaluation-period-start-date.handler"), exports);
__exportStar(require("./update-evaluation-period-grade-ranges.handler"), exports);
__exportStar(require("./update-criteria-setting-permission.handler"), exports);
__exportStar(require("./update-self-evaluation-setting-permission.handler"), exports);
__exportStar(require("./create-evaluation-period-with-auto-targets.handler"), exports);
__exportStar(require("./update-final-evaluation-setting-permission.handler"), exports);
__exportStar(require("./update-manual-setting-permissions.handler"), exports);
const create_evaluation_period_handler_1 = require("./create-evaluation-period.handler");
const start_evaluation_period_handler_1 = require("./start-evaluation-period.handler");
const complete_evaluation_period_handler_1 = require("./complete-evaluation-period.handler");
const delete_evaluation_period_handler_1 = require("./delete-evaluation-period.handler");
const update_evaluation_period_basic_info_handler_1 = require("./update-evaluation-period-basic-info.handler");
const update_evaluation_period_schedule_handler_1 = require("./update-evaluation-period-schedule.handler");
const update_evaluation_setup_deadline_handler_1 = require("./update-evaluation-setup-deadline.handler");
const update_performance_deadline_handler_1 = require("./update-performance-deadline.handler");
const update_self_evaluation_deadline_handler_1 = require("./update-self-evaluation-deadline.handler");
const update_peer_evaluation_deadline_handler_1 = require("./update-peer-evaluation-deadline.handler");
const update_evaluation_period_start_date_handler_1 = require("./update-evaluation-period-start-date.handler");
const update_evaluation_period_grade_ranges_handler_1 = require("./update-evaluation-period-grade-ranges.handler");
const update_criteria_setting_permission_handler_1 = require("./update-criteria-setting-permission.handler");
const update_self_evaluation_setting_permission_handler_1 = require("./update-self-evaluation-setting-permission.handler");
const update_final_evaluation_setting_permission_handler_1 = require("./update-final-evaluation-setting-permission.handler");
const update_manual_setting_permissions_handler_1 = require("./update-manual-setting-permissions.handler");
const create_evaluation_period_with_auto_targets_handler_1 = require("./create-evaluation-period-with-auto-targets.handler");
exports.EVALUATION_PERIOD_COMMAND_HANDLERS = [
    create_evaluation_period_handler_1.CreateEvaluationPeriodCommandHandler,
    create_evaluation_period_with_auto_targets_handler_1.CreateEvaluationPeriodWithAutoTargetsHandler,
    start_evaluation_period_handler_1.StartEvaluationPeriodCommandHandler,
    complete_evaluation_period_handler_1.CompleteEvaluationPeriodCommandHandler,
    delete_evaluation_period_handler_1.DeleteEvaluationPeriodCommandHandler,
    update_evaluation_period_basic_info_handler_1.UpdateEvaluationPeriodBasicInfoCommandHandler,
    update_evaluation_period_schedule_handler_1.UpdateEvaluationPeriodScheduleCommandHandler,
    update_evaluation_setup_deadline_handler_1.UpdateEvaluationSetupDeadlineCommandHandler,
    update_performance_deadline_handler_1.UpdatePerformanceDeadlineCommandHandler,
    update_self_evaluation_deadline_handler_1.UpdateSelfEvaluationDeadlineCommandHandler,
    update_peer_evaluation_deadline_handler_1.UpdatePeerEvaluationDeadlineCommandHandler,
    update_evaluation_period_start_date_handler_1.UpdateEvaluationPeriodStartDateCommandHandler,
    update_evaluation_period_grade_ranges_handler_1.UpdateEvaluationPeriodGradeRangesCommandHandler,
    update_criteria_setting_permission_handler_1.UpdateCriteriaSettingPermissionCommandHandler,
    update_self_evaluation_setting_permission_handler_1.UpdateSelfEvaluationSettingPermissionCommandHandler,
    update_final_evaluation_setting_permission_handler_1.UpdateFinalEvaluationSettingPermissionCommandHandler,
    update_manual_setting_permissions_handler_1.UpdateManualSettingPermissionsCommandHandler,
];
//# sourceMappingURL=index.js.map