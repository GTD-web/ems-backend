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
var ConfirmFinalEvaluationHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfirmFinalEvaluationHandler = exports.ConfirmFinalEvaluationCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const final_evaluation_service_1 = require("../../../../../domain/core/final-evaluation/final-evaluation.service");
const transaction_manager_service_1 = require("../../../../../../libs/database/transaction-manager.service");
class ConfirmFinalEvaluationCommand {
    id;
    confirmedBy;
    constructor(id, confirmedBy) {
        this.id = id;
        this.confirmedBy = confirmedBy;
    }
}
exports.ConfirmFinalEvaluationCommand = ConfirmFinalEvaluationCommand;
let ConfirmFinalEvaluationHandler = ConfirmFinalEvaluationHandler_1 = class ConfirmFinalEvaluationHandler {
    finalEvaluationService;
    transactionManager;
    logger = new common_1.Logger(ConfirmFinalEvaluationHandler_1.name);
    constructor(finalEvaluationService, transactionManager) {
        this.finalEvaluationService = finalEvaluationService;
        this.transactionManager = transactionManager;
    }
    async execute(command) {
        const { id, confirmedBy } = command;
        this.logger.log('최종평가 확정 핸들러 실행', { id, confirmedBy });
        await this.transactionManager.executeTransaction(async (manager) => {
            await this.finalEvaluationService.확정한다(id, confirmedBy, manager);
            this.logger.log('최종평가 확정 완료', { id });
        });
    }
};
exports.ConfirmFinalEvaluationHandler = ConfirmFinalEvaluationHandler;
exports.ConfirmFinalEvaluationHandler = ConfirmFinalEvaluationHandler = ConfirmFinalEvaluationHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(ConfirmFinalEvaluationCommand),
    __metadata("design:paramtypes", [final_evaluation_service_1.FinalEvaluationService,
        transaction_manager_service_1.TransactionManagerService])
], ConfirmFinalEvaluationHandler);
//# sourceMappingURL=confirm-final-evaluation.handler.js.map