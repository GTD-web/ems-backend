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
var GetAvailableProjectsHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAvailableProjectsHandler = exports.GetAvailableProjectsQuery = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const evaluation_period_service_1 = require("../../../../../domain/core/evaluation-period/evaluation-period.service");
const project_service_1 = require("../../../../../domain/common/project/project.service");
const employee_service_1 = require("../../../../../domain/common/employee/employee.service");
const project_types_1 = require("../../../../../domain/common/project/project.types");
class GetAvailableProjectsQuery {
    periodId;
    options;
    constructor(periodId, options = {}) {
        this.periodId = periodId;
        this.options = options;
    }
}
exports.GetAvailableProjectsQuery = GetAvailableProjectsQuery;
let GetAvailableProjectsHandler = GetAvailableProjectsHandler_1 = class GetAvailableProjectsHandler {
    evaluationPeriodService;
    projectService;
    employeeService;
    logger = new common_1.Logger(GetAvailableProjectsHandler_1.name);
    constructor(evaluationPeriodService, projectService, employeeService) {
        this.evaluationPeriodService = evaluationPeriodService;
        this.projectService = projectService;
        this.employeeService = employeeService;
    }
    async execute(query) {
        const { periodId, options } = query;
        const { status = project_types_1.ProjectStatus.ACTIVE, search, page = 1, limit = 20, sortBy = 'name', sortOrder = 'ASC', } = options;
        const evaluationPeriod = await this.evaluationPeriodService.ID로_조회한다(periodId);
        if (!evaluationPeriod) {
            throw new common_1.BadRequestException(`평가기간 ID ${periodId}에 해당하는 평가기간을 찾을 수 없습니다.`);
        }
        const allProjects = await this.projectService.필터_조회한다({
            status: status,
        });
        let projectsWithManager = allProjects.map((project) => ({
            id: project.id,
            name: project.name,
            projectCode: project.projectCode,
            status: project.status,
            startDate: project.startDate,
            endDate: project.endDate,
            manager: project.manager || null,
        }));
        if (search) {
            const searchLower = search.toLowerCase();
            projectsWithManager = projectsWithManager.filter((project) => {
                return (project.name.toLowerCase().includes(searchLower) ||
                    (project.projectCode && project.projectCode.toLowerCase().includes(searchLower)) ||
                    (project.manager && project.manager.name.toLowerCase().includes(searchLower)));
            });
        }
        const validSortBy = ['name', 'projectCode', 'startDate', 'endDate', 'managerName'];
        const normalizedSortBy = validSortBy.includes(sortBy) ? sortBy : 'name';
        projectsWithManager.sort((a, b) => {
            let aValue;
            let bValue;
            switch (normalizedSortBy) {
                case 'name':
                    aValue = a.name;
                    bValue = b.name;
                    break;
                case 'projectCode':
                    aValue = a.projectCode || '';
                    bValue = b.projectCode || '';
                    break;
                case 'startDate':
                    aValue = a.startDate || new Date(0);
                    bValue = b.startDate || new Date(0);
                    break;
                case 'endDate':
                    aValue = a.endDate || new Date(0);
                    bValue = b.endDate || new Date(0);
                    break;
                case 'managerName':
                    aValue = a.manager?.name || '';
                    bValue = b.manager?.name || '';
                    break;
                default:
                    aValue = a.name;
                    bValue = b.name;
            }
            if (aValue < bValue)
                return sortOrder === 'ASC' ? -1 : 1;
            if (aValue > bValue)
                return sortOrder === 'ASC' ? 1 : -1;
            return 0;
        });
        const total = projectsWithManager.length;
        const totalPages = Math.ceil(total / limit);
        const offset = (page - 1) * limit;
        const paginatedProjects = projectsWithManager.slice(offset, offset + limit);
        return {
            periodId,
            projects: paginatedProjects,
            total,
            page,
            limit,
            totalPages,
            search,
            sortBy: normalizedSortBy,
            sortOrder,
        };
    }
};
exports.GetAvailableProjectsHandler = GetAvailableProjectsHandler;
exports.GetAvailableProjectsHandler = GetAvailableProjectsHandler = GetAvailableProjectsHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(GetAvailableProjectsQuery),
    __metadata("design:paramtypes", [evaluation_period_service_1.EvaluationPeriodService,
        project_service_1.ProjectService,
        employee_service_1.EmployeeService])
], GetAvailableProjectsHandler);
//# sourceMappingURL=get-available-projects.handler.js.map