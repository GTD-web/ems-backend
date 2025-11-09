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
var CancelWbsAssignmentHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CancelWbsAssignmentHandler = exports.CancelWbsAssignmentCommand = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const evaluation_wbs_assignment_service_1 = require("../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service");
const evaluation_period_service_1 = require("../../../../../domain/core/evaluation-period/evaluation-period.service");
const transaction_manager_service_1 = require("../../../../../../libs/database/transaction-manager.service");
const wbs_assignment_weight_calculation_service_1 = require("../../../services/wbs-assignment-weight-calculation.service");
class CancelWbsAssignmentCommand {
    id;
    cancelledBy;
    constructor(id, cancelledBy) {
        this.id = id;
        this.cancelledBy = cancelledBy;
    }
}
exports.CancelWbsAssignmentCommand = CancelWbsAssignmentCommand;
let CancelWbsAssignmentHandler = CancelWbsAssignmentHandler_1 = class CancelWbsAssignmentHandler {
    wbsAssignmentService;
    evaluationPeriodService;
    transactionManager;
    weightCalculationService;
    logger = new common_1.Logger(CancelWbsAssignmentHandler_1.name);
    constructor(wbsAssignmentService, evaluationPeriodService, transactionManager, weightCalculationService) {
        this.wbsAssignmentService = wbsAssignmentService;
        this.evaluationPeriodService = evaluationPeriodService;
        this.transactionManager = transactionManager;
        this.weightCalculationService = weightCalculationService;
    }
    async execute(command) {
        const { id, cancelledBy } = command;
        return await this.transactionManager.executeTransaction(async (manager) => {
            const assignment = await this.wbsAssignmentService.ID로_조회한다(id, manager);
            if (!assignment) {
                this.logger.log(`WBS 할당을 찾을 수 없습니다. 이미 삭제된 것으로 간주합니다. - ID: ${id}`);
                return;
            }
            const evaluationPeriod = await this.evaluationPeriodService.ID로_조회한다(assignment.periodId, manager);
            if (!evaluationPeriod) {
                throw new common_1.NotFoundException(`평가기간 ID ${assignment.periodId}에 해당하는 평가기간을 찾을 수 없습니다.`);
            }
            if (evaluationPeriod.완료된_상태인가()) {
                throw new common_1.UnprocessableEntityException('완료된 평가기간에는 WBS 할당을 취소할 수 없습니다.');
            }
            const employeeId = assignment.employeeId;
            const periodId = assignment.periodId;
            await this.wbsAssignmentService.삭제한다(id, cancelledBy, manager);
            this.logger.log(`WBS 할당 취소 완료 - ID: ${id}`);
            await this.weightCalculationService.직원_평가기간_가중치를_재계산한다(employeeId, periodId, manager);
        });
    }
};
exports.CancelWbsAssignmentHandler = CancelWbsAssignmentHandler;
exports.CancelWbsAssignmentHandler = CancelWbsAssignmentHandler = CancelWbsAssignmentHandler_1 = __decorate([
    (0, cqrs_1.CommandHandler)(CancelWbsAssignmentCommand),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [evaluation_wbs_assignment_service_1.EvaluationWbsAssignmentService,
        evaluation_period_service_1.EvaluationPeriodService,
        transaction_manager_service_1.TransactionManagerService,
        wbs_assignment_weight_calculation_service_1.WbsAssignmentWeightCalculationService])
], CancelWbsAssignmentHandler);
//# sourceMappingURL=cancel-wbs-assignment.handler.js.map