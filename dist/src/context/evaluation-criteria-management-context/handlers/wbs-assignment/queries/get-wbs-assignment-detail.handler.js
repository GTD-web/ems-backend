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
exports.GetWbsAssignmentDetailHandler = exports.GetWbsAssignmentDetailQuery = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_wbs_assignment_entity_1 = require("../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity");
const employee_entity_1 = require("../../../../../domain/common/employee/employee.entity");
const department_entity_1 = require("../../../../../domain/common/department/department.entity");
const project_entity_1 = require("../../../../../domain/common/project/project.entity");
const wbs_item_entity_1 = require("../../../../../domain/common/wbs-item/wbs-item.entity");
const evaluation_period_entity_1 = require("../../../../../domain/core/evaluation-period/evaluation-period.entity");
class GetWbsAssignmentDetailQuery {
    employeeId;
    wbsItemId;
    projectId;
    periodId;
    constructor(employeeId, wbsItemId, projectId, periodId) {
        this.employeeId = employeeId;
        this.wbsItemId = wbsItemId;
        this.projectId = projectId;
        this.periodId = periodId;
    }
}
exports.GetWbsAssignmentDetailQuery = GetWbsAssignmentDetailQuery;
let GetWbsAssignmentDetailHandler = class GetWbsAssignmentDetailHandler {
    wbsAssignmentRepository;
    constructor(wbsAssignmentRepository) {
        this.wbsAssignmentRepository = wbsAssignmentRepository;
    }
    async execute(query) {
        const { employeeId, wbsItemId, projectId, periodId } = query;
        const result = await this.wbsAssignmentRepository
            .createQueryBuilder('assignment')
            .leftJoin(employee_entity_1.Employee, 'employee', 'employee.id = assignment.employeeId AND employee.deletedAt IS NULL')
            .leftJoin(department_entity_1.Department, 'department', '"department"."externalId" = "employee"."departmentId" AND "department"."deletedAt" IS NULL')
            .leftJoin(project_entity_1.Project, 'project', 'project.id = assignment.projectId AND project.deletedAt IS NULL')
            .leftJoin(wbs_item_entity_1.WbsItem, 'wbsItem', 'wbsItem.id = assignment.wbsItemId AND wbsItem.deletedAt IS NULL')
            .leftJoin(evaluation_period_entity_1.EvaluationPeriod, 'period', 'period.id = assignment.periodId AND period.deletedAt IS NULL')
            .leftJoin(employee_entity_1.Employee, 'assignedByEmployee', 'assignedByEmployee.id = assignment.assignedBy AND assignedByEmployee.deletedAt IS NULL')
            .select([
            'assignment.id AS assignment_id',
            'assignment.periodId AS assignment_periodid',
            'assignment.employeeId AS assignment_employeeid',
            'assignment.projectId AS assignment_projectid',
            'assignment.wbsItemId AS assignment_wbsitemid',
            'assignment.assignedDate AS assignment_assigneddate',
            'assignment.assignedBy AS assignment_assignedby',
            'assignment.displayOrder AS assignment_displayorder',
            'assignment.createdAt AS assignment_createdat',
            'assignment.updatedAt AS assignment_updatedat',
            'assignment.createdBy AS assignment_createdby',
            'assignment.updatedBy AS assignment_updatedby',
            'employee.id AS employee_id',
            'employee.name AS employee_name',
            'employee.employeeNumber AS employee_employeenumber',
            'employee.email AS employee_email',
            'employee.departmentId AS employee_departmentid',
            'employee.status AS employee_status',
            'department.id AS department_id',
            'department.name AS department_name',
            'department.code AS department_code',
            'project.id AS project_id',
            'project.name AS project_name',
            'project.projectCode AS project_code',
            'project.status AS project_status',
            'project.startDate AS project_startdate',
            'project.endDate AS project_enddate',
            'wbsItem.id AS wbsitem_id',
            'wbsItem.wbsCode AS wbsitem_wbscode',
            'wbsItem.title AS wbsitem_title',
            'wbsItem.status AS wbsitem_status',
            'wbsItem.level AS wbsitem_level',
            'wbsItem.startDate AS wbsitem_startdate',
            'wbsItem.endDate AS wbsitem_enddate',
            'wbsItem.progressPercentage AS wbsitem_progresspercentage',
            'period.id AS period_id',
            'period.name AS period_name',
            'period.startDate AS period_startdate',
            'period.endDate AS period_enddate',
            'period.status AS period_status',
            'assignedByEmployee.id AS assignedbyemployee_id',
            'assignedByEmployee.name AS assignedbyemployee_name',
            'assignedByEmployee.employeeNumber AS assignedbyemployee_employeenumber',
        ])
            .where('assignment.employeeId = :employeeId', { employeeId })
            .andWhere('assignment.wbsItemId = :wbsItemId', { wbsItemId })
            .andWhere('assignment.projectId = :projectId', { projectId })
            .andWhere('assignment.periodId = :periodId', { periodId })
            .andWhere('assignment.deletedAt IS NULL')
            .getRawOne();
        if (!result) {
            return null;
        }
        return {
            id: result.assignment_id,
            periodId: result.assignment_periodid,
            employeeId: result.assignment_employeeid,
            projectId: result.assignment_projectid,
            wbsItemId: result.assignment_wbsitemid,
            assignedDate: result.assignment_assigneddate || new Date(),
            assignedBy: result.assignment_assignedby,
            displayOrder: result.assignment_displayorder,
            createdAt: result.assignment_createdat,
            updatedAt: result.assignment_updatedat,
            createdBy: result.assignment_createdby,
            updatedBy: result.assignment_updatedby,
            employee: result.employee_id
                ? {
                    id: result.employee_id,
                    name: result.employee_name,
                    employeeNumber: result.employee_employeenumber,
                    email: result.employee_email,
                    departmentId: result.employee_departmentid,
                    status: result.employee_status,
                }
                : null,
            department: result.department_id
                ? {
                    id: result.department_id,
                    name: result.department_name,
                    code: result.department_code,
                }
                : null,
            project: result.project_id
                ? {
                    id: result.project_id,
                    name: result.project_name,
                    code: result.project_code,
                    status: result.project_status,
                    startDate: result.project_startdate,
                    endDate: result.project_enddate,
                }
                : null,
            wbsItem: result.wbsitem_id
                ? {
                    id: result.wbsitem_id,
                    wbsCode: result.wbsitem_wbscode,
                    title: result.wbsitem_title,
                    status: result.wbsitem_status,
                    level: result.wbsitem_level,
                    startDate: result.wbsitem_startdate,
                    endDate: result.wbsitem_enddate,
                    progressPercentage: result.wbsitem_progresspercentage,
                }
                : null,
            period: result.period_id
                ? {
                    id: result.period_id,
                    name: result.period_name,
                    startDate: result.period_startdate,
                    endDate: result.period_enddate,
                    status: result.period_status,
                }
                : null,
            assignedByEmployee: result.assignedbyemployee_id
                ? {
                    id: result.assignedbyemployee_id,
                    name: result.assignedbyemployee_name,
                    employeeNumber: result.assignedbyemployee_employeenumber,
                }
                : null,
        };
    }
};
exports.GetWbsAssignmentDetailHandler = GetWbsAssignmentDetailHandler;
exports.GetWbsAssignmentDetailHandler = GetWbsAssignmentDetailHandler = __decorate([
    (0, cqrs_1.QueryHandler)(GetWbsAssignmentDetailQuery),
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], GetWbsAssignmentDetailHandler);
//# sourceMappingURL=get-wbs-assignment-detail.handler.js.map