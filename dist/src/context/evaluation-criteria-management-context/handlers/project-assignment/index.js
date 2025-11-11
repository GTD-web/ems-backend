"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROJECT_ASSIGNMENT_HANDLERS = exports.PROJECT_ASSIGNMENT_QUERY_HANDLERS = exports.PROJECT_ASSIGNMENT_COMMAND_HANDLERS = exports.GetAvailableProjectsHandler = exports.GetAvailableProjectsQuery = exports.GetUnassignedEmployeesHandler = exports.GetUnassignedEmployeesQuery = exports.GetProjectAssignmentDetailHandler = exports.GetProjectAssignmentDetailQuery = exports.GetProjectAssignedEmployeesHandler = exports.GetProjectAssignedEmployeesQuery = exports.GetEmployeeProjectAssignmentsHandler = exports.GetEmployeeProjectAssignmentsQuery = exports.GetProjectAssignmentListHandler = exports.GetProjectAssignmentListQuery = exports.DeleteAllProjectAssignmentsHandler = exports.DeleteAllProjectAssignmentsCommand = exports.ResetPeriodAssignmentsHandler = exports.ResetPeriodAssignmentsCommand = exports.ChangeProjectAssignmentOrderHandler = exports.ChangeProjectAssignmentOrderCommand = exports.BulkCreateProjectAssignmentHandler = exports.BulkCreateProjectAssignmentCommand = exports.CancelProjectAssignmentHandler = exports.CancelProjectAssignmentCommand = exports.CreateProjectAssignmentHandler = exports.CreateProjectAssignmentCommand = void 0;
var create_project_assignment_handler_1 = require("./commands/create-project-assignment.handler");
Object.defineProperty(exports, "CreateProjectAssignmentCommand", { enumerable: true, get: function () { return create_project_assignment_handler_1.CreateProjectAssignmentCommand; } });
Object.defineProperty(exports, "CreateProjectAssignmentHandler", { enumerable: true, get: function () { return create_project_assignment_handler_1.CreateProjectAssignmentHandler; } });
var cancel_project_assignment_handler_1 = require("./commands/cancel-project-assignment.handler");
Object.defineProperty(exports, "CancelProjectAssignmentCommand", { enumerable: true, get: function () { return cancel_project_assignment_handler_1.CancelProjectAssignmentCommand; } });
Object.defineProperty(exports, "CancelProjectAssignmentHandler", { enumerable: true, get: function () { return cancel_project_assignment_handler_1.CancelProjectAssignmentHandler; } });
var bulk_create_project_assignment_handler_1 = require("./commands/bulk-create-project-assignment.handler");
Object.defineProperty(exports, "BulkCreateProjectAssignmentCommand", { enumerable: true, get: function () { return bulk_create_project_assignment_handler_1.BulkCreateProjectAssignmentCommand; } });
Object.defineProperty(exports, "BulkCreateProjectAssignmentHandler", { enumerable: true, get: function () { return bulk_create_project_assignment_handler_1.BulkCreateProjectAssignmentHandler; } });
var change_project_assignment_order_handler_1 = require("./commands/change-project-assignment-order.handler");
Object.defineProperty(exports, "ChangeProjectAssignmentOrderCommand", { enumerable: true, get: function () { return change_project_assignment_order_handler_1.ChangeProjectAssignmentOrderCommand; } });
Object.defineProperty(exports, "ChangeProjectAssignmentOrderHandler", { enumerable: true, get: function () { return change_project_assignment_order_handler_1.ChangeProjectAssignmentOrderHandler; } });
var reset_period_assignments_handler_1 = require("./commands/reset-period-assignments.handler");
Object.defineProperty(exports, "ResetPeriodAssignmentsCommand", { enumerable: true, get: function () { return reset_period_assignments_handler_1.ResetPeriodAssignmentsCommand; } });
Object.defineProperty(exports, "ResetPeriodAssignmentsHandler", { enumerable: true, get: function () { return reset_period_assignments_handler_1.ResetPeriodAssignmentsHandler; } });
var delete_all_project_assignments_handler_1 = require("./commands/delete-all-project-assignments.handler");
Object.defineProperty(exports, "DeleteAllProjectAssignmentsCommand", { enumerable: true, get: function () { return delete_all_project_assignments_handler_1.DeleteAllProjectAssignmentsCommand; } });
Object.defineProperty(exports, "DeleteAllProjectAssignmentsHandler", { enumerable: true, get: function () { return delete_all_project_assignments_handler_1.DeleteAllProjectAssignmentsHandler; } });
var get_project_assignment_list_handler_1 = require("./queries/get-project-assignment-list.handler");
Object.defineProperty(exports, "GetProjectAssignmentListQuery", { enumerable: true, get: function () { return get_project_assignment_list_handler_1.GetProjectAssignmentListQuery; } });
Object.defineProperty(exports, "GetProjectAssignmentListHandler", { enumerable: true, get: function () { return get_project_assignment_list_handler_1.GetProjectAssignmentListHandler; } });
var get_employee_project_assignments_handler_1 = require("./queries/get-employee-project-assignments.handler");
Object.defineProperty(exports, "GetEmployeeProjectAssignmentsQuery", { enumerable: true, get: function () { return get_employee_project_assignments_handler_1.GetEmployeeProjectAssignmentsQuery; } });
Object.defineProperty(exports, "GetEmployeeProjectAssignmentsHandler", { enumerable: true, get: function () { return get_employee_project_assignments_handler_1.GetEmployeeProjectAssignmentsHandler; } });
var get_project_assigned_employees_handler_1 = require("./queries/get-project-assigned-employees.handler");
Object.defineProperty(exports, "GetProjectAssignedEmployeesQuery", { enumerable: true, get: function () { return get_project_assigned_employees_handler_1.GetProjectAssignedEmployeesQuery; } });
Object.defineProperty(exports, "GetProjectAssignedEmployeesHandler", { enumerable: true, get: function () { return get_project_assigned_employees_handler_1.GetProjectAssignedEmployeesHandler; } });
var get_project_assignment_detail_handler_1 = require("./queries/get-project-assignment-detail.handler");
Object.defineProperty(exports, "GetProjectAssignmentDetailQuery", { enumerable: true, get: function () { return get_project_assignment_detail_handler_1.GetProjectAssignmentDetailQuery; } });
Object.defineProperty(exports, "GetProjectAssignmentDetailHandler", { enumerable: true, get: function () { return get_project_assignment_detail_handler_1.GetProjectAssignmentDetailHandler; } });
var get_unassigned_employees_handler_1 = require("./queries/get-unassigned-employees.handler");
Object.defineProperty(exports, "GetUnassignedEmployeesQuery", { enumerable: true, get: function () { return get_unassigned_employees_handler_1.GetUnassignedEmployeesQuery; } });
Object.defineProperty(exports, "GetUnassignedEmployeesHandler", { enumerable: true, get: function () { return get_unassigned_employees_handler_1.GetUnassignedEmployeesHandler; } });
var get_available_projects_handler_1 = require("./queries/get-available-projects.handler");
Object.defineProperty(exports, "GetAvailableProjectsQuery", { enumerable: true, get: function () { return get_available_projects_handler_1.GetAvailableProjectsQuery; } });
Object.defineProperty(exports, "GetAvailableProjectsHandler", { enumerable: true, get: function () { return get_available_projects_handler_1.GetAvailableProjectsHandler; } });
const create_project_assignment_handler_2 = require("./commands/create-project-assignment.handler");
const cancel_project_assignment_handler_2 = require("./commands/cancel-project-assignment.handler");
const bulk_create_project_assignment_handler_2 = require("./commands/bulk-create-project-assignment.handler");
const change_project_assignment_order_handler_2 = require("./commands/change-project-assignment-order.handler");
const reset_period_assignments_handler_2 = require("./commands/reset-period-assignments.handler");
const delete_all_project_assignments_handler_2 = require("./commands/delete-all-project-assignments.handler");
const get_project_assignment_list_handler_2 = require("./queries/get-project-assignment-list.handler");
const get_employee_project_assignments_handler_2 = require("./queries/get-employee-project-assignments.handler");
const get_project_assigned_employees_handler_2 = require("./queries/get-project-assigned-employees.handler");
const get_project_assignment_detail_handler_2 = require("./queries/get-project-assignment-detail.handler");
const get_unassigned_employees_handler_2 = require("./queries/get-unassigned-employees.handler");
const get_available_projects_handler_2 = require("./queries/get-available-projects.handler");
exports.PROJECT_ASSIGNMENT_COMMAND_HANDLERS = [
    create_project_assignment_handler_2.CreateProjectAssignmentHandler,
    cancel_project_assignment_handler_2.CancelProjectAssignmentHandler,
    bulk_create_project_assignment_handler_2.BulkCreateProjectAssignmentHandler,
    change_project_assignment_order_handler_2.ChangeProjectAssignmentOrderHandler,
    reset_period_assignments_handler_2.ResetPeriodAssignmentsHandler,
    delete_all_project_assignments_handler_2.DeleteAllProjectAssignmentsHandler,
];
exports.PROJECT_ASSIGNMENT_QUERY_HANDLERS = [
    get_project_assignment_list_handler_2.GetProjectAssignmentListHandler,
    get_employee_project_assignments_handler_2.GetEmployeeProjectAssignmentsHandler,
    get_project_assigned_employees_handler_2.GetProjectAssignedEmployeesHandler,
    get_project_assignment_detail_handler_2.GetProjectAssignmentDetailHandler,
    get_unassigned_employees_handler_2.GetUnassignedEmployeesHandler,
    get_available_projects_handler_2.GetAvailableProjectsHandler,
];
exports.PROJECT_ASSIGNMENT_HANDLERS = [
    ...exports.PROJECT_ASSIGNMENT_COMMAND_HANDLERS,
    ...exports.PROJECT_ASSIGNMENT_QUERY_HANDLERS,
];
//# sourceMappingURL=index.js.map