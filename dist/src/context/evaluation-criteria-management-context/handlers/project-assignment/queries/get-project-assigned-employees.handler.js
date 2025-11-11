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
exports.GetProjectAssignedEmployeesHandler = exports.GetProjectAssignedEmployeesQuery = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_project_assignment_entity_1 = require("../../../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.entity");
const employee_entity_1 = require("../../../../../domain/common/employee/employee.entity");
const department_entity_1 = require("../../../../../domain/common/department/department.entity");
class GetProjectAssignedEmployeesQuery {
    projectId;
    periodId;
    constructor(projectId, periodId) {
        this.projectId = projectId;
        this.periodId = periodId;
    }
}
exports.GetProjectAssignedEmployeesQuery = GetProjectAssignedEmployeesQuery;
let GetProjectAssignedEmployeesHandler = class GetProjectAssignedEmployeesHandler {
    projectAssignmentRepository;
    constructor(projectAssignmentRepository) {
        this.projectAssignmentRepository = projectAssignmentRepository;
    }
    async execute(query) {
        const { projectId, periodId } = query;
        const results = await this.projectAssignmentRepository
            .createQueryBuilder('assignment')
            .leftJoin(employee_entity_1.Employee, 'employee', 'employee.id = assignment.employeeId AND employee.deletedAt IS NULL')
            .leftJoin(department_entity_1.Department, 'department', 'department.externalId = employee.departmentId AND department.deletedAt IS NULL')
            .select([
            'employee.id AS employee_id',
            'employee.employeeNumber AS employee_employeenumber',
            'employee.name AS employee_name',
            'employee.email AS employee_email',
            'employee.phoneNumber AS employee_phonenumber',
            'employee.status AS employee_status',
            'employee.departmentId AS employee_departmentid',
            'department.name AS department_name',
        ])
            .where('assignment.deletedAt IS NULL')
            .andWhere('assignment.projectId = :projectId', { projectId })
            .andWhere('assignment.periodId = :periodId', { periodId })
            .orderBy('assignment.assignedDate', 'DESC')
            .getRawMany();
        const employees = results
            .filter((result) => result.employee_id)
            .map((result) => ({
            id: result.employee_id,
            employeeNumber: result.employee_employeenumber,
            name: result.employee_name,
            email: result.employee_email,
            phoneNumber: result.employee_phonenumber,
            status: result.employee_status,
            departmentId: result.employee_departmentid,
            departmentName: result.department_name,
        }));
        return { employees };
    }
};
exports.GetProjectAssignedEmployeesHandler = GetProjectAssignedEmployeesHandler;
exports.GetProjectAssignedEmployeesHandler = GetProjectAssignedEmployeesHandler = __decorate([
    (0, cqrs_1.QueryHandler)(GetProjectAssignedEmployeesQuery),
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(evaluation_project_assignment_entity_1.EvaluationProjectAssignment)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], GetProjectAssignedEmployeesHandler);
//# sourceMappingURL=get-project-assigned-employees.handler.js.map