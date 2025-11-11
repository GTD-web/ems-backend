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
exports.GetProjectAssignmentListHandler = exports.GetProjectAssignmentListQuery = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_project_assignment_entity_1 = require("../../../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.entity");
const employee_entity_1 = require("../../../../../domain/common/employee/employee.entity");
const department_entity_1 = require("../../../../../domain/common/department/department.entity");
const project_entity_1 = require("../../../../../domain/common/project/project.entity");
class GetProjectAssignmentListQuery {
    filter;
    constructor(filter) {
        this.filter = filter;
    }
}
exports.GetProjectAssignmentListQuery = GetProjectAssignmentListQuery;
let GetProjectAssignmentListHandler = class GetProjectAssignmentListHandler {
    projectAssignmentRepository;
    employeeRepository;
    departmentRepository;
    projectRepository;
    constructor(projectAssignmentRepository, employeeRepository, departmentRepository, projectRepository) {
        this.projectAssignmentRepository = projectAssignmentRepository;
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.projectRepository = projectRepository;
    }
    async execute(query) {
        const { filter } = query;
        const queryBuilder = this.createQueryBuilder(filter);
        const totalCount = await queryBuilder.getCount();
        const page = Math.max(1, filter.page || 1);
        const limit = Math.max(1, filter.limit || 10);
        const offset = (page - 1) * limit;
        const assignments = await queryBuilder
            .leftJoinAndSelect(employee_entity_1.Employee, 'employee', '"employee"."id"::varchar = "assignment"."employeeId"::varchar AND "employee"."deletedAt" IS NULL')
            .leftJoinAndSelect(department_entity_1.Department, 'department', '"department"."externalId"::varchar = "employee"."departmentId"::varchar AND "department"."deletedAt" IS NULL')
            .leftJoinAndSelect(employee_entity_1.Employee, 'assignedBy', '"assignedBy"."id"::varchar = "assignment"."assignedBy"::varchar AND "assignedBy"."deletedAt" IS NULL')
            .leftJoinAndSelect(project_entity_1.Project, 'project', '"project"."id"::varchar = "assignment"."projectId"::varchar AND "project"."deletedAt" IS NULL')
            .skip(offset)
            .take(limit)
            .getMany();
        const assignmentsWithDetails = assignments.map((assignment) => {
            const employee = assignment.employee;
            const department = assignment.department;
            const assignedByEmployee = assignment.assignedBy;
            const project = assignment.project;
            return {
                id: assignment.id,
                periodId: assignment.periodId,
                employeeId: assignment.employeeId,
                employeeName: employee?.name || '',
                departmentName: department?.name || '',
                projectId: assignment.projectId,
                projectName: project?.name || '',
                assignedDate: assignment.assignedDate,
                assignedBy: assignment.assignedBy,
                assignedByName: assignedByEmployee?.name || '',
                displayOrder: assignment.displayOrder,
            };
        });
        return {
            assignments: assignmentsWithDetails,
            totalCount,
            page,
            limit,
        };
    }
    createQueryBuilder(filter) {
        const queryBuilder = this.projectAssignmentRepository
            .createQueryBuilder('assignment')
            .where('assignment.deletedAt IS NULL');
        if (filter.periodId) {
            queryBuilder.andWhere('assignment.periodId = :periodId', {
                periodId: filter.periodId,
            });
        }
        if (filter.employeeId) {
            queryBuilder.andWhere('assignment.employeeId = :employeeId', {
                employeeId: filter.employeeId,
            });
        }
        if (filter.projectId) {
            queryBuilder.andWhere('assignment.projectId = :projectId', {
                projectId: filter.projectId,
            });
        }
        if (filter.assignedBy) {
            queryBuilder.andWhere('assignment.assignedBy = :assignedBy', {
                assignedBy: filter.assignedBy,
            });
        }
        if (filter.assignedDateFrom) {
            queryBuilder.andWhere('assignment.assignedDate >= :assignedDateFrom', {
                assignedDateFrom: filter.assignedDateFrom,
            });
        }
        if (filter.assignedDateTo) {
            queryBuilder.andWhere('assignment.assignedDate <= :assignedDateTo', {
                assignedDateTo: filter.assignedDateTo,
            });
        }
        queryBuilder.addOrderBy('assignment.displayOrder', 'ASC');
        const orderBy = filter.orderBy || 'assignedDate';
        const orderDirection = filter.orderDirection || 'DESC';
        if (orderBy !== 'displayOrder') {
            queryBuilder.addOrderBy(`assignment.${orderBy}`, orderDirection);
        }
        return queryBuilder;
    }
};
exports.GetProjectAssignmentListHandler = GetProjectAssignmentListHandler;
exports.GetProjectAssignmentListHandler = GetProjectAssignmentListHandler = __decorate([
    (0, cqrs_1.QueryHandler)(GetProjectAssignmentListQuery),
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(evaluation_project_assignment_entity_1.EvaluationProjectAssignment)),
    __param(1, (0, typeorm_1.InjectRepository)(employee_entity_1.Employee)),
    __param(2, (0, typeorm_1.InjectRepository)(department_entity_1.Department)),
    __param(3, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], GetProjectAssignmentListHandler);
//# sourceMappingURL=get-project-assignment-list.handler.js.map