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
var UpdateDownwardEvaluationHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateDownwardEvaluationHandler = exports.UpdateDownwardEvaluationCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const downward_evaluation_service_1 = require("../../../../../domain/core/downward-evaluation/downward-evaluation.service");
const transaction_manager_service_1 = require("../../../../../../libs/database/transaction-manager.service");
class UpdateDownwardEvaluationCommand {
    evaluationId;
    downwardEvaluationContent;
    downwardEvaluationScore;
    updatedBy;
    constructor(evaluationId, downwardEvaluationContent, downwardEvaluationScore, updatedBy = '시스템') {
        this.evaluationId = evaluationId;
        this.downwardEvaluationContent = downwardEvaluationContent;
        this.downwardEvaluationScore = downwardEvaluationScore;
        this.updatedBy = updatedBy;
    }
}
exports.UpdateDownwardEvaluationCommand = UpdateDownwardEvaluationCommand;
let UpdateDownwardEvaluationHandler = UpdateDownwardEvaluationHandler_1 = class UpdateDownwardEvaluationHandler {
    downwardEvaluationService;
    transactionManager;
    logger = new common_1.Logger(UpdateDownwardEvaluationHandler_1.name);
    constructor(downwardEvaluationService, transactionManager) {
        this.downwardEvaluationService = downwardEvaluationService;
        this.transactionManager = transactionManager;
    }
    async execute(command) {
        const { evaluationId, downwardEvaluationContent, downwardEvaluationScore, updatedBy, } = command;
        this.logger.log('하향평가 수정 핸들러 실행', { evaluationId });
        return await this.transactionManager.executeTransaction(async () => {
            await this.downwardEvaluationService.수정한다(evaluationId, {
                downwardEvaluationContent,
                downwardEvaluationScore,
            }, updatedBy);
            this.logger.log('하향평가 수정 완료', { evaluationId });
        });
    }
};
exports.UpdateDownwardEvaluationHandler = UpdateDownwardEvaluationHandler;
exports.UpdateDownwardEvaluationHandler = UpdateDownwardEvaluationHandler = UpdateDownwardEvaluationHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(UpdateDownwardEvaluationCommand),
    __metadata("design:paramtypes", [downward_evaluation_service_1.DownwardEvaluationService,
        transaction_manager_service_1.TransactionManagerService])
], UpdateDownwardEvaluationHandler);
//# sourceMappingURL=update-downward-evaluation.handler.js.map