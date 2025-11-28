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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetDepartmentHierarchyWithEmployeesQueryHandler = exports.GetDepartmentHierarchyWithEmployeesQuery = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const department_service_1 = require("../../../domain/common/department/department.service");
const employee_service_1 = require("../../../domain/common/employee/employee.service");
const typeorm_1 = require("typeorm");
const typeorm_2 = require("@nestjs/typeorm");
const typeorm_3 = require("typeorm");
const department_entity_1 = require("../../../domain/common/department/department.entity");
class GetDepartmentHierarchyWithEmployeesQuery {
}
exports.GetDepartmentHierarchyWithEmployeesQuery = GetDepartmentHierarchyWithEmployeesQuery;
let GetDepartmentHierarchyWithEmployeesQueryHandler = class GetDepartmentHierarchyWithEmployeesQueryHandler {
    departmentService;
    employeeService;
    departmentRepository;
    constructor(departmentService, employeeService, departmentRepository) {
        this.departmentService = departmentService;
        this.employeeService = employeeService;
        this.departmentRepository = departmentRepository;
    }
    async execute(query) {
        const allDepartments = await this.departmentRepository.find({
            where: { deletedAt: (0, typeorm_1.IsNull)() },
            order: { order: 'ASC', name: 'ASC' },
        });
        const allEmployees = await this.employeeService.findAll();
        const employeesByDeptExternalId = allEmployees.reduce((acc, emp) => {
            const deptId = emp.departmentId;
            if (deptId) {
                if (!acc[deptId])
                    acc[deptId] = [];
                acc[deptId].push({
                    id: emp.id,
                    employeeNumber: emp.employeeNumber,
                    name: emp.name,
                    email: emp.email,
                    rankName: emp.rankName,
                    rankCode: emp.rankCode,
                    rankLevel: emp.rankLevel,
                    isActive: emp.status === '재직중',
                });
            }
            return acc;
        }, {});
        const departmentByExternalId = new Map();
        const rootDepartments = [];
        allDepartments.forEach((dept) => {
            const employees = employeesByDeptExternalId[dept.externalId] || [];
            const deptHierarchy = {
                id: dept.id,
                name: dept.name,
                code: dept.code,
                order: dept.order,
                parentDepartmentId: dept.parentDepartmentId,
                level: 0,
                depth: 0,
                childrenCount: 0,
                totalDescendants: 0,
                employeeCount: employees.length,
                employees: employees,
                subDepartments: [],
            };
            departmentByExternalId.set(dept.externalId, deptHierarchy);
        });
        allDepartments.forEach((dept) => {
            const deptHierarchy = departmentByExternalId.get(dept.externalId);
            if (dept.parentDepartmentId) {
                const parent = departmentByExternalId.get(dept.parentDepartmentId);
                if (parent) {
                    parent.subDepartments.push(deptHierarchy);
                }
                else {
                    rootDepartments.push(deptHierarchy);
                }
            }
            else {
                rootDepartments.push(deptHierarchy);
            }
        });
        this.calculateHierarchyInfo(rootDepartments, 0);
        return rootDepartments;
    }
    calculateHierarchyInfo(departments, currentLevel) {
        let maxDepthInLevel = 0;
        for (const dept of departments) {
            dept.level = currentLevel;
            dept.childrenCount = dept.subDepartments.length;
            if (dept.subDepartments.length === 0) {
                dept.depth = 0;
                dept.totalDescendants = 0;
            }
            else {
                const childDepth = this.calculateHierarchyInfo(dept.subDepartments, currentLevel + 1);
                dept.depth = childDepth + 1;
                dept.totalDescendants = dept.subDepartments.reduce((sum, child) => sum + 1 + child.totalDescendants, 0);
                maxDepthInLevel = Math.max(maxDepthInLevel, childDepth + 1);
            }
        }
        return maxDepthInLevel;
    }
};
exports.GetDepartmentHierarchyWithEmployeesQueryHandler = GetDepartmentHierarchyWithEmployeesQueryHandler;
exports.GetDepartmentHierarchyWithEmployeesQueryHandler = GetDepartmentHierarchyWithEmployeesQueryHandler = __decorate([
    (0, cqrs_1.QueryHandler)(GetDepartmentHierarchyWithEmployeesQuery),
    (0, common_1.Injectable)(),
    __param(2, (0, typeorm_2.InjectRepository)(department_entity_1.Department)),
    __metadata("design:paramtypes", [department_service_1.DepartmentService,
        employee_service_1.EmployeeService,
        typeorm_3.Repository])
], GetDepartmentHierarchyWithEmployeesQueryHandler);
//# sourceMappingURL=get-department-hierarchy-with-employees.handler.js.map