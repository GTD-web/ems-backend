"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QUERY_HANDLERS = exports.GetAllEmployeesFinalEvaluationsHandler = exports.GetAllEmployeesFinalEvaluationsQuery = exports.GetFinalEvaluationsByEmployeeHandler = exports.GetFinalEvaluationsByEmployeeQuery = exports.GetFinalEvaluationsByPeriodHandler = exports.GetFinalEvaluationsByPeriodQuery = exports.GetEvaluatorAssignedEmployeesDataHandler = exports.GetEvaluatorAssignedEmployeesDataQuery = exports.GetEmployeeAssignedDataHandler = exports.GetEmployeeAssignedDataQuery = exports.GetMyEvaluationTargetsStatusHandler = exports.GetMyEvaluationTargetsStatusQuery = exports.GetAllEmployeesEvaluationPeriodStatusHandler = exports.GetAllEmployeesEvaluationPeriodStatusQuery = exports.GetEmployeeEvaluationPeriodStatusHandler = exports.GetEmployeeEvaluationPeriodStatusQuery = void 0;
var get_employee_evaluation_period_status_1 = require("./get-employee-evaluation-period-status");
Object.defineProperty(exports, "GetEmployeeEvaluationPeriodStatusQuery", { enumerable: true, get: function () { return get_employee_evaluation_period_status_1.GetEmployeeEvaluationPeriodStatusQuery; } });
Object.defineProperty(exports, "GetEmployeeEvaluationPeriodStatusHandler", { enumerable: true, get: function () { return get_employee_evaluation_period_status_1.GetEmployeeEvaluationPeriodStatusHandler; } });
var get_all_employees_evaluation_period_status_query_1 = require("./get-all-employees-evaluation-period-status.query");
Object.defineProperty(exports, "GetAllEmployeesEvaluationPeriodStatusQuery", { enumerable: true, get: function () { return get_all_employees_evaluation_period_status_query_1.GetAllEmployeesEvaluationPeriodStatusQuery; } });
Object.defineProperty(exports, "GetAllEmployeesEvaluationPeriodStatusHandler", { enumerable: true, get: function () { return get_all_employees_evaluation_period_status_query_1.GetAllEmployeesEvaluationPeriodStatusHandler; } });
var get_my_evaluation_targets_status_query_1 = require("./get-my-evaluation-targets-status.query");
Object.defineProperty(exports, "GetMyEvaluationTargetsStatusQuery", { enumerable: true, get: function () { return get_my_evaluation_targets_status_query_1.GetMyEvaluationTargetsStatusQuery; } });
Object.defineProperty(exports, "GetMyEvaluationTargetsStatusHandler", { enumerable: true, get: function () { return get_my_evaluation_targets_status_query_1.GetMyEvaluationTargetsStatusHandler; } });
var get_employee_assigned_data_1 = require("./get-employee-assigned-data");
Object.defineProperty(exports, "GetEmployeeAssignedDataQuery", { enumerable: true, get: function () { return get_employee_assigned_data_1.GetEmployeeAssignedDataQuery; } });
Object.defineProperty(exports, "GetEmployeeAssignedDataHandler", { enumerable: true, get: function () { return get_employee_assigned_data_1.GetEmployeeAssignedDataHandler; } });
var get_evaluator_assigned_employees_data_query_1 = require("./get-evaluator-assigned-employees-data.query");
Object.defineProperty(exports, "GetEvaluatorAssignedEmployeesDataQuery", { enumerable: true, get: function () { return get_evaluator_assigned_employees_data_query_1.GetEvaluatorAssignedEmployeesDataQuery; } });
Object.defineProperty(exports, "GetEvaluatorAssignedEmployeesDataHandler", { enumerable: true, get: function () { return get_evaluator_assigned_employees_data_query_1.GetEvaluatorAssignedEmployeesDataHandler; } });
var get_final_evaluations_by_period_query_1 = require("./get-final-evaluations-by-period.query");
Object.defineProperty(exports, "GetFinalEvaluationsByPeriodQuery", { enumerable: true, get: function () { return get_final_evaluations_by_period_query_1.GetFinalEvaluationsByPeriodQuery; } });
Object.defineProperty(exports, "GetFinalEvaluationsByPeriodHandler", { enumerable: true, get: function () { return get_final_evaluations_by_period_query_1.GetFinalEvaluationsByPeriodHandler; } });
var get_final_evaluations_by_employee_query_1 = require("./get-final-evaluations-by-employee.query");
Object.defineProperty(exports, "GetFinalEvaluationsByEmployeeQuery", { enumerable: true, get: function () { return get_final_evaluations_by_employee_query_1.GetFinalEvaluationsByEmployeeQuery; } });
Object.defineProperty(exports, "GetFinalEvaluationsByEmployeeHandler", { enumerable: true, get: function () { return get_final_evaluations_by_employee_query_1.GetFinalEvaluationsByEmployeeHandler; } });
var get_all_employees_final_evaluations_query_1 = require("./get-all-employees-final-evaluations.query");
Object.defineProperty(exports, "GetAllEmployeesFinalEvaluationsQuery", { enumerable: true, get: function () { return get_all_employees_final_evaluations_query_1.GetAllEmployeesFinalEvaluationsQuery; } });
Object.defineProperty(exports, "GetAllEmployeesFinalEvaluationsHandler", { enumerable: true, get: function () { return get_all_employees_final_evaluations_query_1.GetAllEmployeesFinalEvaluationsHandler; } });
const get_employee_evaluation_period_status_2 = require("./get-employee-evaluation-period-status");
const get_all_employees_evaluation_period_status_query_2 = require("./get-all-employees-evaluation-period-status.query");
const get_my_evaluation_targets_status_query_2 = require("./get-my-evaluation-targets-status.query");
const get_employee_assigned_data_2 = require("./get-employee-assigned-data");
const get_evaluator_assigned_employees_data_query_2 = require("./get-evaluator-assigned-employees-data.query");
const get_final_evaluations_by_period_query_2 = require("./get-final-evaluations-by-period.query");
const get_final_evaluations_by_employee_query_2 = require("./get-final-evaluations-by-employee.query");
const get_all_employees_final_evaluations_query_2 = require("./get-all-employees-final-evaluations.query");
exports.QUERY_HANDLERS = [
    get_employee_evaluation_period_status_2.GetEmployeeEvaluationPeriodStatusHandler,
    get_all_employees_evaluation_period_status_query_2.GetAllEmployeesEvaluationPeriodStatusHandler,
    get_my_evaluation_targets_status_query_2.GetMyEvaluationTargetsStatusHandler,
    get_employee_assigned_data_2.GetEmployeeAssignedDataHandler,
    get_evaluator_assigned_employees_data_query_2.GetEvaluatorAssignedEmployeesDataHandler,
    get_final_evaluations_by_period_query_2.GetFinalEvaluationsByPeriodHandler,
    get_final_evaluations_by_employee_query_2.GetFinalEvaluationsByEmployeeHandler,
    get_all_employees_final_evaluations_query_2.GetAllEmployeesFinalEvaluationsHandler,
];
//# sourceMappingURL=index.js.map