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
var UpdateWbsSelfEvaluationHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateWbsSelfEvaluationHandler = exports.UpdateWbsSelfEvaluationCommand = void 0;
const transaction_manager_service_1 = require("../../../../../../libs/database/transaction-manager.service");
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const wbs_self_evaluation_service_1 = require("../../../../../domain/core/wbs-self-evaluation/wbs-self-evaluation.service");
class UpdateWbsSelfEvaluationCommand {
    evaluationId;
    selfEvaluationContent;
    selfEvaluationScore;
    performanceResult;
    updatedBy;
    constructor(evaluationId, selfEvaluationContent, selfEvaluationScore, performanceResult, updatedBy = '시스템') {
        this.evaluationId = evaluationId;
        this.selfEvaluationContent = selfEvaluationContent;
        this.selfEvaluationScore = selfEvaluationScore;
        this.performanceResult = performanceResult;
        this.updatedBy = updatedBy;
    }
}
exports.UpdateWbsSelfEvaluationCommand = UpdateWbsSelfEvaluationCommand;
let UpdateWbsSelfEvaluationHandler = UpdateWbsSelfEvaluationHandler_1 = class UpdateWbsSelfEvaluationHandler {
    wbsSelfEvaluationService;
    transactionManager;
    logger = new common_1.Logger(UpdateWbsSelfEvaluationHandler_1.name);
    constructor(wbsSelfEvaluationService, transactionManager) {
        this.wbsSelfEvaluationService = wbsSelfEvaluationService;
        this.transactionManager = transactionManager;
    }
    async execute(command) {
        const { evaluationId, selfEvaluationContent, selfEvaluationScore, performanceResult, updatedBy, } = command;
        this.logger.log('WBS 자기평가 수정 핸들러 실행', { evaluationId });
        return await this.transactionManager.executeTransaction(async () => {
            const evaluation = await this.wbsSelfEvaluationService.수정한다(evaluationId, {
                selfEvaluationContent,
                selfEvaluationScore,
                performanceResult,
            }, updatedBy);
            this.logger.log('WBS 자기평가 수정 완료', { evaluationId });
            return evaluation.DTO로_변환한다();
        });
    }
};
exports.UpdateWbsSelfEvaluationHandler = UpdateWbsSelfEvaluationHandler;
exports.UpdateWbsSelfEvaluationHandler = UpdateWbsSelfEvaluationHandler = UpdateWbsSelfEvaluationHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(UpdateWbsSelfEvaluationCommand),
    __metadata("design:paramtypes", [wbs_self_evaluation_service_1.WbsSelfEvaluationService,
        transaction_manager_service_1.TransactionManagerService])
], UpdateWbsSelfEvaluationHandler);
//# sourceMappingURL=update-wbs-self-evaluation.handler.js.map