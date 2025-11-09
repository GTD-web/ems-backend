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
var ResetWbsSelfEvaluationToEvaluatorHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResetWbsSelfEvaluationToEvaluatorHandler = exports.ResetWbsSelfEvaluationToEvaluatorCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const wbs_self_evaluation_service_1 = require("../../../../../domain/core/wbs-self-evaluation/wbs-self-evaluation.service");
const transaction_manager_service_1 = require("../../../../../../libs/database/transaction-manager.service");
class ResetWbsSelfEvaluationToEvaluatorCommand {
    evaluationId;
    resetBy;
    constructor(evaluationId, resetBy = '시스템') {
        this.evaluationId = evaluationId;
        this.resetBy = resetBy;
    }
}
exports.ResetWbsSelfEvaluationToEvaluatorCommand = ResetWbsSelfEvaluationToEvaluatorCommand;
let ResetWbsSelfEvaluationToEvaluatorHandler = ResetWbsSelfEvaluationToEvaluatorHandler_1 = class ResetWbsSelfEvaluationToEvaluatorHandler {
    wbsSelfEvaluationService;
    transactionManager;
    logger = new common_1.Logger(ResetWbsSelfEvaluationToEvaluatorHandler_1.name);
    constructor(wbsSelfEvaluationService, transactionManager) {
        this.wbsSelfEvaluationService = wbsSelfEvaluationService;
        this.transactionManager = transactionManager;
    }
    async execute(command) {
        const { evaluationId, resetBy } = command;
        this.logger.log('WBS 자기평가 취소 시작 (피평가자 → 1차 평가자 제출 취소)', { evaluationId });
        return await this.transactionManager.executeTransaction(async () => {
            const updatedEvaluation = await this.wbsSelfEvaluationService.피평가자가_1차평가자에게_제출한_것을_취소한다(evaluationId, resetBy);
            this.logger.log('WBS 자기평가 취소 완료 (피평가자 → 1차 평가자 제출 취소)', {
                evaluationId,
            });
            return updatedEvaluation.DTO로_변환한다();
        });
    }
};
exports.ResetWbsSelfEvaluationToEvaluatorHandler = ResetWbsSelfEvaluationToEvaluatorHandler;
exports.ResetWbsSelfEvaluationToEvaluatorHandler = ResetWbsSelfEvaluationToEvaluatorHandler = ResetWbsSelfEvaluationToEvaluatorHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(ResetWbsSelfEvaluationToEvaluatorCommand),
    __metadata("design:paramtypes", [wbs_self_evaluation_service_1.WbsSelfEvaluationService,
        transaction_manager_service_1.TransactionManagerService])
], ResetWbsSelfEvaluationToEvaluatorHandler);
//# sourceMappingURL=reset-wbs-self-evaluation-to-evaluator.handler.js.map