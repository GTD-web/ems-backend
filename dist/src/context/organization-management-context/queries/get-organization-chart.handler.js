"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetOrganizationChartQueryHandler = exports.GetOrganizationChartQuery = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const department_service_1 = require("../../../domain/common/department/department.service");
const employee_service_1 = require("../../../domain/common/employee/employee.service");
class GetOrganizationChartQuery {
}
exports.GetOrganizationChartQuery = GetOrganizationChartQuery;
let GetOrganizationChartQueryHandler = class GetOrganizationChartQueryHandler {
    departmentService;
    employeeService;
    constructor(departmentService, employeeService) {
        this.departmentService = departmentService;
        this.employeeService = employeeService;
    }
    async execute(query) {
        const allDepartments = await this.departmentService.findAll();
        const allEmployees = await this.employeeService.findAll();
        const employeesByDept = allEmployees.reduce((acc, emp) => {
            const deptId = emp.departmentId || 'unassigned';
            if (!acc[deptId])
                acc[deptId] = [];
            acc[deptId].push(emp.DTO로_변환한다());
            return acc;
        }, {});
        const departmentByExternalId = new Map();
        const rootDepartments = [];
        allDepartments.forEach((dept) => {
            const deptDto = dept.DTO로_변환한다();
            const deptWithEmployees = {
                ...deptDto,
                employees: employeesByDept[dept.id] || [],
                subDepartments: [],
            };
            departmentByExternalId.set(dept.externalId, deptWithEmployees);
        });
        allDepartments.forEach((dept) => {
            const deptWithEmployees = departmentByExternalId.get(dept.externalId);
            if (dept.parentDepartmentId) {
                const parent = departmentByExternalId.get(dept.parentDepartmentId);
                if (parent) {
                    parent.subDepartments.push(deptWithEmployees);
                }
                else {
                    rootDepartments.push(deptWithEmployees);
                }
            }
            else {
                rootDepartments.push(deptWithEmployees);
            }
        });
        return {
            departments: rootDepartments,
            totalEmployeeCount: allEmployees.length,
            lastUpdatedAt: new Date(),
        };
    }
};
exports.GetOrganizationChartQueryHandler = GetOrganizationChartQueryHandler;
exports.GetOrganizationChartQueryHandler = GetOrganizationChartQueryHandler = __decorate([
    (0, cqrs_1.QueryHandler)(GetOrganizationChartQuery),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [department_service_1.DepartmentService,
        employee_service_1.EmployeeService])
], GetOrganizationChartQueryHandler);
//# sourceMappingURL=get-organization-chart.handler.js.map