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
exports.GetEmployeeProjectAssignmentsHandler = exports.GetEmployeeProjectAssignmentsQuery = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_project_assignment_entity_1 = require("../../../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.entity");
const project_entity_1 = require("../../../../../domain/common/project/project.entity");
class GetEmployeeProjectAssignmentsQuery {
    employeeId;
    periodId;
    constructor(employeeId, periodId) {
        this.employeeId = employeeId;
        this.periodId = periodId;
    }
}
exports.GetEmployeeProjectAssignmentsQuery = GetEmployeeProjectAssignmentsQuery;
let GetEmployeeProjectAssignmentsHandler = class GetEmployeeProjectAssignmentsHandler {
    projectAssignmentRepository;
    constructor(projectAssignmentRepository) {
        this.projectAssignmentRepository = projectAssignmentRepository;
    }
    async execute(query) {
        const { employeeId, periodId } = query;
        const results = await this.projectAssignmentRepository
            .createQueryBuilder('assignment')
            .leftJoin(project_entity_1.Project, 'project', 'project.id = assignment.projectId AND project.deletedAt IS NULL')
            .select([
            'project.id AS project_id',
            'project.name AS project_name',
            'project.projectCode AS project_projectcode',
            'project.status AS project_status',
            'project.startDate AS project_startdate',
            'project.endDate AS project_enddate',
            'project.managerId AS project_managerid',
        ])
            .where('assignment.deletedAt IS NULL')
            .andWhere('assignment.periodId = :periodId', { periodId })
            .andWhere('assignment.employeeId = :employeeId', { employeeId })
            .orderBy('assignment.assignedDate', 'DESC')
            .getRawMany();
        const projects = results
            .filter((result) => result.project_id)
            .map((result) => ({
            id: result.project_id,
            name: result.project_name,
            projectCode: result.project_projectcode,
            status: result.project_status,
            startDate: result.project_startdate,
            endDate: result.project_enddate,
            managerId: result.project_managerid,
        }));
        return { projects };
    }
};
exports.GetEmployeeProjectAssignmentsHandler = GetEmployeeProjectAssignmentsHandler;
exports.GetEmployeeProjectAssignmentsHandler = GetEmployeeProjectAssignmentsHandler = __decorate([
    (0, cqrs_1.QueryHandler)(GetEmployeeProjectAssignmentsQuery),
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(evaluation_project_assignment_entity_1.EvaluationProjectAssignment)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], GetEmployeeProjectAssignmentsHandler);
//# sourceMappingURL=get-employee-project-assignments.handler.js.map