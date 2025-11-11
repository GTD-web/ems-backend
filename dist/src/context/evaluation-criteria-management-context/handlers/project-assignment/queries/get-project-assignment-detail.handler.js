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
exports.GetProjectAssignmentDetailHandler = exports.GetProjectAssignmentDetailQuery = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_project_assignment_entity_1 = require("../../../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.entity");
const evaluation_period_entity_1 = require("../../../../../domain/core/evaluation-period/evaluation-period.entity");
const employee_entity_1 = require("../../../../../domain/common/employee/employee.entity");
const project_entity_1 = require("../../../../../domain/common/project/project.entity");
const department_entity_1 = require("../../../../../domain/common/department/department.entity");
class GetProjectAssignmentDetailQuery {
    assignmentId;
    constructor(assignmentId) {
        this.assignmentId = assignmentId;
    }
}
exports.GetProjectAssignmentDetailQuery = GetProjectAssignmentDetailQuery;
let GetProjectAssignmentDetailHandler = class GetProjectAssignmentDetailHandler {
    projectAssignmentRepository;
    constructor(projectAssignmentRepository) {
        this.projectAssignmentRepository = projectAssignmentRepository;
    }
    async execute(query) {
        const { assignmentId } = query;
        const result = await this.projectAssignmentRepository
            .createQueryBuilder('assignment')
            .leftJoin(evaluation_period_entity_1.EvaluationPeriod, 'period', 'period.id = assignment.periodId AND period.deletedAt IS NULL')
            .leftJoin(employee_entity_1.Employee, 'employee', 'employee.id = assignment.employeeId AND employee.deletedAt IS NULL')
            .leftJoin(project_entity_1.Project, 'project', 'project.id = assignment.projectId AND project.deletedAt IS NULL')
            .leftJoin(employee_entity_1.Employee, 'assignedByEmployee', 'assignedByEmployee.id = assignment.assignedBy AND assignedByEmployee.deletedAt IS NULL')
            .leftJoin(department_entity_1.Department, 'employeeDept', '"employeeDept"."externalId" = "employee"."departmentId" AND "employeeDept"."deletedAt" IS NULL')
            .leftJoin(department_entity_1.Department, 'assignedByDept', '"assignedByDept"."externalId" = "assignedByEmployee"."departmentId" AND "assignedByDept"."deletedAt" IS NULL')
            .select([
            'assignment.id AS assignment_id',
            'assignment.assignedDate AS assignment_assigneddate',
            'assignment.createdAt AS assignment_createdat',
            'assignment.updatedAt AS assignment_updatedat',
            'assignment.deletedAt AS assignment_deletedat',
            'assignment.createdBy AS assignment_createdby',
            'assignment.updatedBy AS assignment_updatedby',
            'assignment.version AS assignment_version',
            'period.id AS period_id',
            'period.name AS period_name',
            'period.startDate AS period_startdate',
            'period.endDate AS period_enddate',
            'period.status AS period_status',
            'period.description AS period_description',
            'employee.id AS employee_id',
            'employee.employeeNumber AS employee_employeenumber',
            'employee.name AS employee_name',
            'employee.email AS employee_email',
            'employee.phoneNumber AS employee_phonenumber',
            'employee.status AS employee_status',
            'employee.departmentId AS employee_departmentid',
            'employeeDept.name AS employeedept_name',
            'project.id AS project_id',
            'project.name AS project_name',
            'project.projectCode AS project_projectcode',
            'project.status AS project_status',
            'project.startDate AS project_startdate',
            'project.endDate AS project_enddate',
            'project.managerId AS project_managerid',
            'assignedByEmployee.id AS assignedbyemployee_id',
            'assignedByEmployee.employeeNumber AS assignedbyemployee_employeenumber',
            'assignedByEmployee.name AS assignedbyemployee_name',
            'assignedByEmployee.email AS assignedbyemployee_email',
            'assignedByEmployee.departmentId AS assignedbyemployee_departmentid',
            'assignedByDept.name AS assignedbydept_name',
        ])
            .where('assignment.id = :assignmentId', { assignmentId })
            .andWhere('assignment.deletedAt IS NULL')
            .getRawOne();
        if (!result) {
            return null;
        }
        return {
            id: result.assignment_id,
            assignedDate: result.assignment_assigneddate || new Date(),
            createdAt: result.assignment_createdat,
            updatedAt: result.assignment_updatedat,
            deletedAt: result.assignment_deletedat,
            createdBy: result.assignment_createdby,
            updatedBy: result.assignment_updatedby,
            version: result.assignment_version,
            evaluationPeriod: result.period_id
                ? {
                    id: result.period_id,
                    name: result.period_name,
                    startDate: result.period_startdate,
                    endDate: result.period_enddate,
                    status: result.period_status,
                    description: result.period_description,
                }
                : null,
            employee: result.employee_id
                ? {
                    id: result.employee_id,
                    employeeNumber: result.employee_employeenumber,
                    name: result.employee_name,
                    email: result.employee_email,
                    phoneNumber: result.employee_phonenumber,
                    status: result.employee_status,
                    departmentId: result.employee_departmentid,
                    departmentName: result.employeedept_name,
                }
                : null,
            project: result.project_id
                ? {
                    id: result.project_id,
                    name: result.project_name,
                    projectCode: result.project_projectcode,
                    status: result.project_status,
                    startDate: result.project_startdate,
                    endDate: result.project_enddate,
                    managerId: result.project_managerid,
                }
                : null,
            assignedBy: result.assignedbyemployee_id
                ? {
                    id: result.assignedbyemployee_id,
                    employeeNumber: result.assignedbyemployee_employeenumber,
                    name: result.assignedbyemployee_name,
                    email: result.assignedbyemployee_email,
                    departmentId: result.assignedbyemployee_departmentid,
                    departmentName: result.assignedbydept_name,
                }
                : null,
        };
    }
};
exports.GetProjectAssignmentDetailHandler = GetProjectAssignmentDetailHandler;
exports.GetProjectAssignmentDetailHandler = GetProjectAssignmentDetailHandler = __decorate([
    (0, cqrs_1.QueryHandler)(GetProjectAssignmentDetailQuery),
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(evaluation_project_assignment_entity_1.EvaluationProjectAssignment)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], GetProjectAssignmentDetailHandler);
//# sourceMappingURL=get-project-assignment-detail.handler.js.map