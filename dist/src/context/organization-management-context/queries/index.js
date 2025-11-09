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
exports.QUERY_HANDLERS = void 0;
__exportStar(require("./get-all-departments.handler"), exports);
__exportStar(require("./get-department.handler"), exports);
__exportStar(require("./get-employees-by-department.handler"), exports);
__exportStar(require("./get-organization-chart.handler"), exports);
__exportStar(require("./get-all-employees.handler"), exports);
__exportStar(require("./get-manager.handler"), exports);
__exportStar(require("./get-subordinates.handler"), exports);
__exportStar(require("./get-sub-departments.handler"), exports);
__exportStar(require("./get-parent-department.handler"), exports);
__exportStar(require("./get-active-employees.handler"), exports);
__exportStar(require("./get-department-hierarchy.handler"), exports);
__exportStar(require("./get-department-hierarchy-with-employees.handler"), exports);
__exportStar(require("./find-department-manager.handler"), exports);
const get_all_departments_handler_1 = require("./get-all-departments.handler");
const get_department_handler_1 = require("./get-department.handler");
const get_employees_by_department_handler_1 = require("./get-employees-by-department.handler");
const get_organization_chart_handler_1 = require("./get-organization-chart.handler");
const get_all_employees_handler_1 = require("./get-all-employees.handler");
const get_manager_handler_1 = require("./get-manager.handler");
const get_subordinates_handler_1 = require("./get-subordinates.handler");
const get_sub_departments_handler_1 = require("./get-sub-departments.handler");
const get_parent_department_handler_1 = require("./get-parent-department.handler");
const get_active_employees_handler_1 = require("./get-active-employees.handler");
const get_department_hierarchy_handler_1 = require("./get-department-hierarchy.handler");
const get_department_hierarchy_with_employees_handler_1 = require("./get-department-hierarchy-with-employees.handler");
const find_department_manager_handler_1 = require("./find-department-manager.handler");
exports.QUERY_HANDLERS = [
    get_all_departments_handler_1.GetAllDepartmentsQueryHandler,
    get_department_handler_1.GetDepartmentQueryHandler,
    get_employees_by_department_handler_1.GetEmployeesByDepartmentQueryHandler,
    get_organization_chart_handler_1.GetOrganizationChartQueryHandler,
    get_all_employees_handler_1.GetAllEmployeesQueryHandler,
    get_manager_handler_1.GetManagerQueryHandler,
    get_subordinates_handler_1.GetSubordinatesQueryHandler,
    get_sub_departments_handler_1.GetSubDepartmentsQueryHandler,
    get_parent_department_handler_1.GetParentDepartmentQueryHandler,
    get_active_employees_handler_1.GetActiveEmployeesQueryHandler,
    get_department_hierarchy_handler_1.GetDepartmentHierarchyQueryHandler,
    get_department_hierarchy_with_employees_handler_1.GetDepartmentHierarchyWithEmployeesQueryHandler,
    find_department_manager_handler_1.FindDepartmentManagerHandler,
];
//# sourceMappingURL=index.js.map