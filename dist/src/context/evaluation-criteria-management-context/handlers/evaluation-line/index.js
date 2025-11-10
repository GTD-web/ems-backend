"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EVALUATION_LINE_HANDLERS = exports.EVALUATION_LINE_QUERY_HANDLERS = exports.EVALUATION_LINE_COMMAND_HANDLERS = exports.GetPrimaryEvaluatorsByPeriodHandler = exports.GetPrimaryEvaluatorsByPeriodQuery = exports.GetEvaluatorsByPeriodHandler = exports.GetEvaluatorsByPeriodQuery = exports.GetUpdaterEvaluationLineMappingsHandler = exports.GetUpdaterEvaluationLineMappingsQuery = exports.GetEvaluatorEmployeesHandler = exports.GetEvaluatorEmployeesQuery = exports.GetEvaluationLineListHandler = exports.GetEvaluationLineListQuery = exports.GetEmployeeEvaluationSettingsHandler = exports.GetEmployeeEvaluationSettingsQuery = exports.GetEmployeeEvaluationLineMappingsHandler = exports.GetEmployeeEvaluationLineMappingsQuery = exports.AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesHandler = exports.AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesCommand = exports.ConfigureSecondaryEvaluatorHandler = exports.ConfigureSecondaryEvaluatorCommand = exports.ConfigurePrimaryEvaluatorHandler = exports.ConfigurePrimaryEvaluatorCommand = exports.ConfigureEmployeeWbsEvaluationLineHandler = exports.ConfigureEmployeeWbsEvaluationLineCommand = void 0;
var configure_employee_wbs_evaluation_line_handler_1 = require("./commands/configure-employee-wbs-evaluation-line.handler");
Object.defineProperty(exports, "ConfigureEmployeeWbsEvaluationLineCommand", { enumerable: true, get: function () { return configure_employee_wbs_evaluation_line_handler_1.ConfigureEmployeeWbsEvaluationLineCommand; } });
Object.defineProperty(exports, "ConfigureEmployeeWbsEvaluationLineHandler", { enumerable: true, get: function () { return configure_employee_wbs_evaluation_line_handler_1.ConfigureEmployeeWbsEvaluationLineHandler; } });
var configure_primary_evaluator_handler_1 = require("./commands/configure-primary-evaluator.handler");
Object.defineProperty(exports, "ConfigurePrimaryEvaluatorCommand", { enumerable: true, get: function () { return configure_primary_evaluator_handler_1.ConfigurePrimaryEvaluatorCommand; } });
Object.defineProperty(exports, "ConfigurePrimaryEvaluatorHandler", { enumerable: true, get: function () { return configure_primary_evaluator_handler_1.ConfigurePrimaryEvaluatorHandler; } });
var configure_secondary_evaluator_handler_1 = require("./commands/configure-secondary-evaluator.handler");
Object.defineProperty(exports, "ConfigureSecondaryEvaluatorCommand", { enumerable: true, get: function () { return configure_secondary_evaluator_handler_1.ConfigureSecondaryEvaluatorCommand; } });
Object.defineProperty(exports, "ConfigureSecondaryEvaluatorHandler", { enumerable: true, get: function () { return configure_secondary_evaluator_handler_1.ConfigureSecondaryEvaluatorHandler; } });
var auto_configure_primary_evaluator_by_manager_for_all_employees_handler_1 = require("./commands/auto-configure-primary-evaluator-by-manager-for-all-employees.handler");
Object.defineProperty(exports, "AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesCommand", { enumerable: true, get: function () { return auto_configure_primary_evaluator_by_manager_for_all_employees_handler_1.AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesCommand; } });
Object.defineProperty(exports, "AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesHandler", { enumerable: true, get: function () { return auto_configure_primary_evaluator_by_manager_for_all_employees_handler_1.AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesHandler; } });
var get_employee_evaluation_line_mappings_handler_1 = require("./queries/get-employee-evaluation-line-mappings.handler");
Object.defineProperty(exports, "GetEmployeeEvaluationLineMappingsQuery", { enumerable: true, get: function () { return get_employee_evaluation_line_mappings_handler_1.GetEmployeeEvaluationLineMappingsQuery; } });
Object.defineProperty(exports, "GetEmployeeEvaluationLineMappingsHandler", { enumerable: true, get: function () { return get_employee_evaluation_line_mappings_handler_1.GetEmployeeEvaluationLineMappingsHandler; } });
var get_employee_evaluation_settings_handler_1 = require("./queries/get-employee-evaluation-settings.handler");
Object.defineProperty(exports, "GetEmployeeEvaluationSettingsQuery", { enumerable: true, get: function () { return get_employee_evaluation_settings_handler_1.GetEmployeeEvaluationSettingsQuery; } });
Object.defineProperty(exports, "GetEmployeeEvaluationSettingsHandler", { enumerable: true, get: function () { return get_employee_evaluation_settings_handler_1.GetEmployeeEvaluationSettingsHandler; } });
var get_evaluation_line_list_handler_1 = require("./queries/get-evaluation-line-list.handler");
Object.defineProperty(exports, "GetEvaluationLineListQuery", { enumerable: true, get: function () { return get_evaluation_line_list_handler_1.GetEvaluationLineListQuery; } });
Object.defineProperty(exports, "GetEvaluationLineListHandler", { enumerable: true, get: function () { return get_evaluation_line_list_handler_1.GetEvaluationLineListHandler; } });
var get_evaluator_employees_handler_1 = require("./queries/get-evaluator-employees.handler");
Object.defineProperty(exports, "GetEvaluatorEmployeesQuery", { enumerable: true, get: function () { return get_evaluator_employees_handler_1.GetEvaluatorEmployeesQuery; } });
Object.defineProperty(exports, "GetEvaluatorEmployeesHandler", { enumerable: true, get: function () { return get_evaluator_employees_handler_1.GetEvaluatorEmployeesHandler; } });
var get_updater_evaluation_line_mappings_handler_1 = require("./queries/get-updater-evaluation-line-mappings.handler");
Object.defineProperty(exports, "GetUpdaterEvaluationLineMappingsQuery", { enumerable: true, get: function () { return get_updater_evaluation_line_mappings_handler_1.GetUpdaterEvaluationLineMappingsQuery; } });
Object.defineProperty(exports, "GetUpdaterEvaluationLineMappingsHandler", { enumerable: true, get: function () { return get_updater_evaluation_line_mappings_handler_1.GetUpdaterEvaluationLineMappingsHandler; } });
var get_evaluators_by_period_handler_1 = require("./queries/get-evaluators-by-period.handler");
Object.defineProperty(exports, "GetEvaluatorsByPeriodQuery", { enumerable: true, get: function () { return get_evaluators_by_period_handler_1.GetEvaluatorsByPeriodQuery; } });
Object.defineProperty(exports, "GetEvaluatorsByPeriodHandler", { enumerable: true, get: function () { return get_evaluators_by_period_handler_1.GetEvaluatorsByPeriodHandler; } });
Object.defineProperty(exports, "GetPrimaryEvaluatorsByPeriodQuery", { enumerable: true, get: function () { return get_evaluators_by_period_handler_1.GetPrimaryEvaluatorsByPeriodQuery; } });
Object.defineProperty(exports, "GetPrimaryEvaluatorsByPeriodHandler", { enumerable: true, get: function () { return get_evaluators_by_period_handler_1.GetPrimaryEvaluatorsByPeriodHandler; } });
const configure_employee_wbs_evaluation_line_handler_2 = require("./commands/configure-employee-wbs-evaluation-line.handler");
const configure_primary_evaluator_handler_2 = require("./commands/configure-primary-evaluator.handler");
const configure_secondary_evaluator_handler_2 = require("./commands/configure-secondary-evaluator.handler");
const auto_configure_primary_evaluator_by_manager_for_all_employees_handler_2 = require("./commands/auto-configure-primary-evaluator-by-manager-for-all-employees.handler");
const get_employee_evaluation_line_mappings_handler_2 = require("./queries/get-employee-evaluation-line-mappings.handler");
const get_employee_evaluation_settings_handler_2 = require("./queries/get-employee-evaluation-settings.handler");
const get_evaluation_line_list_handler_2 = require("./queries/get-evaluation-line-list.handler");
const get_evaluator_employees_handler_2 = require("./queries/get-evaluator-employees.handler");
const get_updater_evaluation_line_mappings_handler_2 = require("./queries/get-updater-evaluation-line-mappings.handler");
const get_evaluators_by_period_handler_2 = require("./queries/get-evaluators-by-period.handler");
exports.EVALUATION_LINE_COMMAND_HANDLERS = [
    configure_employee_wbs_evaluation_line_handler_2.ConfigureEmployeeWbsEvaluationLineHandler,
    configure_primary_evaluator_handler_2.ConfigurePrimaryEvaluatorHandler,
    configure_secondary_evaluator_handler_2.ConfigureSecondaryEvaluatorHandler,
    auto_configure_primary_evaluator_by_manager_for_all_employees_handler_2.AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesHandler,
];
exports.EVALUATION_LINE_QUERY_HANDLERS = [
    get_employee_evaluation_line_mappings_handler_2.GetEmployeeEvaluationLineMappingsHandler,
    get_employee_evaluation_settings_handler_2.GetEmployeeEvaluationSettingsHandler,
    get_evaluation_line_list_handler_2.GetEvaluationLineListHandler,
    get_evaluator_employees_handler_2.GetEvaluatorEmployeesHandler,
    get_updater_evaluation_line_mappings_handler_2.GetUpdaterEvaluationLineMappingsHandler,
    get_evaluators_by_period_handler_2.GetEvaluatorsByPeriodHandler,
];
exports.EVALUATION_LINE_HANDLERS = [
    ...exports.EVALUATION_LINE_COMMAND_HANDLERS,
    ...exports.EVALUATION_LINE_QUERY_HANDLERS,
];
//# sourceMappingURL=index.js.map