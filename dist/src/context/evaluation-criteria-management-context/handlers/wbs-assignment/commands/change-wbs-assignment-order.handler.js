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
exports.ChangeWbsAssignmentOrderHandler = exports.ChangeWbsAssignmentOrderCommand = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const evaluation_wbs_assignment_service_1 = require("../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service");
const evaluation_period_service_1 = require("../../../../../domain/core/evaluation-period/evaluation-period.service");
const transaction_manager_service_1 = require("../../../../../../libs/database/transaction-manager.service");
class ChangeWbsAssignmentOrderCommand {
    assignmentId;
    direction;
    updatedBy;
    constructor(assignmentId, direction, updatedBy) {
        this.assignmentId = assignmentId;
        this.direction = direction;
        this.updatedBy = updatedBy;
    }
}
exports.ChangeWbsAssignmentOrderCommand = ChangeWbsAssignmentOrderCommand;
let ChangeWbsAssignmentOrderHandler = class ChangeWbsAssignmentOrderHandler {
    wbsAssignmentService;
    evaluationPeriodService;
    transactionManager;
    constructor(wbsAssignmentService, evaluationPeriodService, transactionManager) {
        this.wbsAssignmentService = wbsAssignmentService;
        this.evaluationPeriodService = evaluationPeriodService;
        this.transactionManager = transactionManager;
    }
    async execute(command) {
        const { assignmentId, direction, updatedBy } = command;
        return await this.transactionManager.executeTransaction(async (manager) => {
            const assignment = await this.wbsAssignmentService.ID로_조회한다(assignmentId, manager);
            if (!assignment) {
                throw new common_1.NotFoundException(`WBS 할당 ID ${assignmentId}에 해당하는 할당을 찾을 수 없습니다.`);
            }
            const evaluationPeriod = await this.evaluationPeriodService.ID로_조회한다(assignment.periodId, manager);
            if (!evaluationPeriod) {
                throw new common_1.NotFoundException(`평가기간 ID ${assignment.periodId}에 해당하는 평가기간을 찾을 수 없습니다.`);
            }
            if (evaluationPeriod.완료된_상태인가()) {
                throw new common_1.UnprocessableEntityException('완료된 평가기간에는 WBS 할당 순서를 변경할 수 없습니다.');
            }
            const updatedAssignment = await this.wbsAssignmentService.순서를_변경한다(assignmentId, direction, updatedBy, manager);
            if (!updatedAssignment) {
                throw new common_1.NotFoundException(`WBS 할당 ID ${assignmentId}에 해당하는 할당을 찾을 수 없습니다.`);
            }
            return updatedAssignment.DTO로_변환한다();
        });
    }
};
exports.ChangeWbsAssignmentOrderHandler = ChangeWbsAssignmentOrderHandler;
exports.ChangeWbsAssignmentOrderHandler = ChangeWbsAssignmentOrderHandler = __decorate([
    (0, cqrs_1.CommandHandler)(ChangeWbsAssignmentOrderCommand),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [evaluation_wbs_assignment_service_1.EvaluationWbsAssignmentService,
        evaluation_period_service_1.EvaluationPeriodService,
        transaction_manager_service_1.TransactionManagerService])
], ChangeWbsAssignmentOrderHandler);
//# sourceMappingURL=change-wbs-assignment-order.handler.js.map