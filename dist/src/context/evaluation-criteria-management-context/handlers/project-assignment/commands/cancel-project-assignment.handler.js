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
exports.CancelProjectAssignmentHandler = exports.CancelProjectAssignmentCommand = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const evaluation_project_assignment_service_1 = require("../../../../../domain/core/evaluation-project-assignment/evaluation-project-assignment.service");
const project_service_1 = require("../../../../../domain/common/project/project.service");
const transaction_manager_service_1 = require("../../../../../../libs/database/transaction-manager.service");
const evaluation_period_service_1 = require("../../../../../domain/core/evaluation-period/evaluation-period.service");
class CancelProjectAssignmentCommand {
    id;
    cancelledBy;
    constructor(id, cancelledBy) {
        this.id = id;
        this.cancelledBy = cancelledBy;
    }
}
exports.CancelProjectAssignmentCommand = CancelProjectAssignmentCommand;
let CancelProjectAssignmentHandler = class CancelProjectAssignmentHandler {
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
        const { id, cancelledBy } = command;
        return await this.transactionManager.executeTransaction(async (manager) => {
            const assignment = await this.projectAssignmentService.ID로_조회한다(id, manager);
            if (!assignment) {
                throw new common_1.NotFoundException(`프로젝트 할당 ID ${id}에 해당하는 할당을 찾을 수 없습니다.`);
            }
            const assignmentDto = assignment.DTO로_변환한다();
            const project = await this.projectService.ID로_조회한다(assignmentDto.projectId);
            if (!project) {
                throw new common_1.NotFoundException(`프로젝트 ID ${assignmentDto.projectId}에 해당하는 프로젝트를 찾을 수 없습니다.`);
            }
            const evaluationPeriod = await this.evaluationPeriodService.ID로_조회한다(assignment.periodId, manager);
            if (!evaluationPeriod) {
                throw new common_1.NotFoundException(`평가기간 ID ${assignment.periodId}에 해당하는 평가기간을 찾을 수 없습니다.`);
            }
            if (evaluationPeriod.완료된_상태인가()) {
                throw new common_1.UnprocessableEntityException('완료된 평가기간에는 프로젝트 할당을 취소할 수 없습니다.');
            }
            await this.projectAssignmentService.삭제한다(id, cancelledBy, manager);
        });
    }
};
exports.CancelProjectAssignmentHandler = CancelProjectAssignmentHandler;
exports.CancelProjectAssignmentHandler = CancelProjectAssignmentHandler = __decorate([
    (0, cqrs_1.CommandHandler)(CancelProjectAssignmentCommand),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [evaluation_project_assignment_service_1.EvaluationProjectAssignmentService,
        project_service_1.ProjectService,
        evaluation_period_service_1.EvaluationPeriodService,
        transaction_manager_service_1.TransactionManagerService])
], CancelProjectAssignmentHandler);
//# sourceMappingURL=cancel-project-assignment.handler.js.map