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
var ResetWbsSelfEvaluationHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResetWbsSelfEvaluationHandler = exports.ResetWbsSelfEvaluationCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const wbs_self_evaluation_service_1 = require("../../../../../domain/core/wbs-self-evaluation/wbs-self-evaluation.service");
const transaction_manager_service_1 = require("../../../../../../libs/database/transaction-manager.service");
class ResetWbsSelfEvaluationCommand {
    evaluationId;
    resetBy;
    constructor(evaluationId, resetBy = '시스템') {
        this.evaluationId = evaluationId;
        this.resetBy = resetBy;
    }
}
exports.ResetWbsSelfEvaluationCommand = ResetWbsSelfEvaluationCommand;
let ResetWbsSelfEvaluationHandler = ResetWbsSelfEvaluationHandler_1 = class ResetWbsSelfEvaluationHandler {
    wbsSelfEvaluationService;
    transactionManager;
    logger = new common_1.Logger(ResetWbsSelfEvaluationHandler_1.name);
    constructor(wbsSelfEvaluationService, transactionManager) {
        this.wbsSelfEvaluationService = wbsSelfEvaluationService;
        this.transactionManager = transactionManager;
    }
    async execute(command) {
        const { evaluationId, resetBy } = command;
        this.logger.log('WBS 자기평가 초기화 시작', { evaluationId });
        return await this.transactionManager.executeTransaction(async () => {
            const evaluation = await this.wbsSelfEvaluationService.조회한다(evaluationId);
            if (!evaluation) {
                throw new common_1.BadRequestException('존재하지 않는 자기평가입니다.');
            }
            if (!evaluation.일차평가자가_관리자에게_제출했는가()) {
                throw new common_1.BadRequestException('이미 관리자에게 미제출 상태인 자기평가입니다.');
            }
            const updatedEvaluation = await this.wbsSelfEvaluationService.수정한다(evaluationId, { submittedToManager: false }, resetBy);
            this.logger.log('WBS 자기평가 초기화 완료', { evaluationId });
            return updatedEvaluation.DTO로_변환한다();
        });
    }
};
exports.ResetWbsSelfEvaluationHandler = ResetWbsSelfEvaluationHandler;
exports.ResetWbsSelfEvaluationHandler = ResetWbsSelfEvaluationHandler = ResetWbsSelfEvaluationHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(ResetWbsSelfEvaluationCommand),
    __metadata("design:paramtypes", [wbs_self_evaluation_service_1.WbsSelfEvaluationService,
        transaction_manager_service_1.TransactionManagerService])
], ResetWbsSelfEvaluationHandler);
//# sourceMappingURL=reset-wbs-self-evaluation.handler.js.map