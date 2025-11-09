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
var UpdatePeriodAllEvaluationEditableStatusHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePeriodAllEvaluationEditableStatusHandler = exports.UpdatePeriodAllEvaluationEditableStatusCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const evaluation_period_employee_mapping_service_1 = require("../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service");
const transaction_manager_service_1 = require("../../../../../libs/database/transaction-manager.service");
class UpdatePeriodAllEvaluationEditableStatusCommand {
    evaluationPeriodId;
    isSelfEvaluationEditable;
    isPrimaryEvaluationEditable;
    isSecondaryEvaluationEditable;
    updatedBy;
    constructor(evaluationPeriodId, isSelfEvaluationEditable, isPrimaryEvaluationEditable, isSecondaryEvaluationEditable, updatedBy = '시스템') {
        this.evaluationPeriodId = evaluationPeriodId;
        this.isSelfEvaluationEditable = isSelfEvaluationEditable;
        this.isPrimaryEvaluationEditable = isPrimaryEvaluationEditable;
        this.isSecondaryEvaluationEditable = isSecondaryEvaluationEditable;
        this.updatedBy = updatedBy;
    }
}
exports.UpdatePeriodAllEvaluationEditableStatusCommand = UpdatePeriodAllEvaluationEditableStatusCommand;
let UpdatePeriodAllEvaluationEditableStatusHandler = UpdatePeriodAllEvaluationEditableStatusHandler_1 = class UpdatePeriodAllEvaluationEditableStatusHandler {
    evaluationPeriodEmployeeMappingService;
    transactionManager;
    logger = new common_1.Logger(UpdatePeriodAllEvaluationEditableStatusHandler_1.name);
    constructor(evaluationPeriodEmployeeMappingService, transactionManager) {
        this.evaluationPeriodEmployeeMappingService = evaluationPeriodEmployeeMappingService;
        this.transactionManager = transactionManager;
    }
    async execute(command) {
        const { evaluationPeriodId, isSelfEvaluationEditable, isPrimaryEvaluationEditable, isSecondaryEvaluationEditable, updatedBy, } = command;
        this.logger.log('평가기간별 모든 평가 수정 가능 상태 일괄 변경 시작', {
            evaluationPeriodId,
            isSelfEvaluationEditable,
            isPrimaryEvaluationEditable,
            isSecondaryEvaluationEditable,
        });
        return await this.transactionManager.executeTransaction(async () => {
            const updatedCount = await this.evaluationPeriodEmployeeMappingService.평가기간별_모든_평가_수정_가능_상태를_변경한다(evaluationPeriodId, isSelfEvaluationEditable, isPrimaryEvaluationEditable, isSecondaryEvaluationEditable, updatedBy);
            const result = {
                updatedCount,
                evaluationPeriodId,
                isSelfEvaluationEditable,
                isPrimaryEvaluationEditable,
                isSecondaryEvaluationEditable,
            };
            this.logger.log('평가기간별 모든 평가 수정 가능 상태 일괄 변경 완료', {
                evaluationPeriodId,
                updatedCount,
            });
            return result;
        });
    }
};
exports.UpdatePeriodAllEvaluationEditableStatusHandler = UpdatePeriodAllEvaluationEditableStatusHandler;
exports.UpdatePeriodAllEvaluationEditableStatusHandler = UpdatePeriodAllEvaluationEditableStatusHandler = UpdatePeriodAllEvaluationEditableStatusHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(UpdatePeriodAllEvaluationEditableStatusCommand),
    __metadata("design:paramtypes", [evaluation_period_employee_mapping_service_1.EvaluationPeriodEmployeeMappingService,
        transaction_manager_service_1.TransactionManagerService])
], UpdatePeriodAllEvaluationEditableStatusHandler);
//# sourceMappingURL=update-period-all-evaluation-editable-status.handler.js.map