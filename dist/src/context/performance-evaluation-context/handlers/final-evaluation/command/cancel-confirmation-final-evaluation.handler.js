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
var CancelConfirmationFinalEvaluationHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CancelConfirmationFinalEvaluationHandler = exports.CancelConfirmationFinalEvaluationCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const final_evaluation_service_1 = require("../../../../../domain/core/final-evaluation/final-evaluation.service");
const transaction_manager_service_1 = require("../../../../../../libs/database/transaction-manager.service");
class CancelConfirmationFinalEvaluationCommand {
    id;
    updatedBy;
    constructor(id, updatedBy) {
        this.id = id;
        this.updatedBy = updatedBy;
    }
}
exports.CancelConfirmationFinalEvaluationCommand = CancelConfirmationFinalEvaluationCommand;
let CancelConfirmationFinalEvaluationHandler = CancelConfirmationFinalEvaluationHandler_1 = class CancelConfirmationFinalEvaluationHandler {
    finalEvaluationService;
    transactionManager;
    logger = new common_1.Logger(CancelConfirmationFinalEvaluationHandler_1.name);
    constructor(finalEvaluationService, transactionManager) {
        this.finalEvaluationService = finalEvaluationService;
        this.transactionManager = transactionManager;
    }
    async execute(command) {
        const { id, updatedBy } = command;
        this.logger.log('최종평가 확정 취소 핸들러 실행', { id, updatedBy });
        await this.transactionManager.executeTransaction(async (manager) => {
            await this.finalEvaluationService.확정_취소한다(id, updatedBy, manager);
            this.logger.log('최종평가 확정 취소 완료', { id });
        });
    }
};
exports.CancelConfirmationFinalEvaluationHandler = CancelConfirmationFinalEvaluationHandler;
exports.CancelConfirmationFinalEvaluationHandler = CancelConfirmationFinalEvaluationHandler = CancelConfirmationFinalEvaluationHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(CancelConfirmationFinalEvaluationCommand),
    __metadata("design:paramtypes", [final_evaluation_service_1.FinalEvaluationService,
        transaction_manager_service_1.TransactionManagerService])
], CancelConfirmationFinalEvaluationHandler);
//# sourceMappingURL=cancel-confirmation-final-evaluation.handler.js.map