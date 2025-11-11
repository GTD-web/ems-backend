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
var DeleteFinalEvaluationHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteFinalEvaluationHandler = exports.DeleteFinalEvaluationCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const final_evaluation_service_1 = require("../../../../../domain/core/final-evaluation/final-evaluation.service");
const transaction_manager_service_1 = require("../../../../../../libs/database/transaction-manager.service");
class DeleteFinalEvaluationCommand {
    id;
    deletedBy;
    constructor(id, deletedBy = '시스템') {
        this.id = id;
        this.deletedBy = deletedBy;
    }
}
exports.DeleteFinalEvaluationCommand = DeleteFinalEvaluationCommand;
let DeleteFinalEvaluationHandler = DeleteFinalEvaluationHandler_1 = class DeleteFinalEvaluationHandler {
    finalEvaluationService;
    transactionManager;
    logger = new common_1.Logger(DeleteFinalEvaluationHandler_1.name);
    constructor(finalEvaluationService, transactionManager) {
        this.finalEvaluationService = finalEvaluationService;
        this.transactionManager = transactionManager;
    }
    async execute(command) {
        const { id, deletedBy } = command;
        this.logger.log('최종평가 삭제 핸들러 실행', { id });
        await this.transactionManager.executeTransaction(async (manager) => {
            await this.finalEvaluationService.삭제한다(id, deletedBy, manager);
            this.logger.log('최종평가 삭제 완료', { id });
        });
    }
};
exports.DeleteFinalEvaluationHandler = DeleteFinalEvaluationHandler;
exports.DeleteFinalEvaluationHandler = DeleteFinalEvaluationHandler = DeleteFinalEvaluationHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(DeleteFinalEvaluationCommand),
    __metadata("design:paramtypes", [final_evaluation_service_1.FinalEvaluationService,
        transaction_manager_service_1.TransactionManagerService])
], DeleteFinalEvaluationHandler);
//# sourceMappingURL=delete-final-evaluation.handler.js.map