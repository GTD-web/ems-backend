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
exports.BulkCreateProjectAssignmentHandler = exports.BulkCreateProjectAssignmentCommand = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const evaluation_project_assignment_service_1 = require("../../../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.service");
const project_service_1 = require("../../../../../domain/common/project/project.service");
const evaluation_period_service_1 = require("../../../../../domain/core/evaluation-period/evaluation-period.service");
const transaction_manager_service_1 = require("../../../../../../libs/database/transaction-manager.service");
class BulkCreateProjectAssignmentCommand {
    assignments;
    assignedBy;
    constructor(assignments, assignedBy) {
        this.assignments = assignments;
        this.assignedBy = assignedBy;
    }
}
exports.BulkCreateProjectAssignmentCommand = BulkCreateProjectAssignmentCommand;
let BulkCreateProjectAssignmentHandler = class BulkCreateProjectAssignmentHandler {
    projectAssignmentService;
    projectService;
    evaluationPeriodService;
    transactionManager;
    constructor(projectAssignmentService, projectService, evaluationPeriodService, transactionManager) {
        this.projectAssignmentService = projectAssignmentService;
        this.projectService = projectService;
        this.evaluationPeriodService = evaluationPeriodService;
        this.transactionManager = transactionManager;
    }
    async execute(command) {
        const { assignments, assignedBy } = command;
        return await this.transactionManager.executeTransaction(async (manager) => {
            const results = [];
            const projectIds = [
                ...new Set(assignments.map((data) => data.projectId)),
            ];
            for (const projectId of projectIds) {
                const project = await this.projectService.ID로_조회한다(projectId);
                if (!project) {
                    throw new common_1.BadRequestException(`프로젝트 ID ${projectId}에 해당하는 프로젝트를 찾을 수 없습니다.`);
                }
            }
            const periodIds = [...new Set(assignments.map((data) => data.periodId))];
            for (const periodId of periodIds) {
                const evaluationPeriod = await this.evaluationPeriodService.ID로_조회한다(periodId, manager);
                if (!evaluationPeriod) {
                    throw new common_1.BadRequestException(`평가기간 ID ${periodId}에 해당하는 평가기간을 찾을 수 없습니다.`);
                }
                if (evaluationPeriod.완료된_상태인가()) {
                    throw new common_1.UnprocessableEntityException(`완료된 평가기간 ID ${periodId}에는 프로젝트 할당을 생성할 수 없습니다.`);
                }
            }
            for (const data of assignments) {
                const assignmentData = {
                    ...data,
                    assignedBy: assignedBy,
                };
                const assignment = await this.projectAssignmentService.생성한다(assignmentData, manager);
                results.push(assignment.DTO로_변환한다());
            }
            return results;
        });
    }
};
exports.BulkCreateProjectAssignmentHandler = BulkCreateProjectAssignmentHandler;
exports.BulkCreateProjectAssignmentHandler = BulkCreateProjectAssignmentHandler = __decorate([
    (0, cqrs_1.CommandHandler)(BulkCreateProjectAssignmentCommand),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [evaluation_project_assignment_service_1.EvaluationProjectAssignmentService,
        project_service_1.ProjectService,
        evaluation_period_service_1.EvaluationPeriodService,
        transaction_manager_service_1.TransactionManagerService])
], BulkCreateProjectAssignmentHandler);
//# sourceMappingURL=bulk-create-project-assignment.handler.js.map