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
var SubmitDownwardEvaluationHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmitDownwardEvaluationHandler = exports.SubmitDownwardEvaluationCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const downward_evaluation_service_1 = require("../../../../../domain/core/downward-evaluation/downward-evaluation.service");
const downward_evaluation_exceptions_1 = require("../../../../../domain/core/downward-evaluation/downward-evaluation.exceptions");
const transaction_manager_service_1 = require("../../../../../../libs/database/transaction-manager.service");
class SubmitDownwardEvaluationCommand {
    evaluationId;
    submittedBy;
    constructor(evaluationId, submittedBy = '시스템') {
        this.evaluationId = evaluationId;
        this.submittedBy = submittedBy;
    }
}
exports.SubmitDownwardEvaluationCommand = SubmitDownwardEvaluationCommand;
let SubmitDownwardEvaluationHandler = SubmitDownwardEvaluationHandler_1 = class SubmitDownwardEvaluationHandler {
    downwardEvaluationService;
    transactionManager;
    logger = new common_1.Logger(SubmitDownwardEvaluationHandler_1.name);
    constructor(downwardEvaluationService, transactionManager) {
        this.downwardEvaluationService = downwardEvaluationService;
        this.transactionManager = transactionManager;
    }
    async execute(command) {
        const { evaluationId, submittedBy } = command;
        this.logger.log('하향평가 제출 핸들러 실행', { evaluationId });
        await this.transactionManager.executeTransaction(async () => {
            const evaluation = await this.downwardEvaluationService.조회한다(evaluationId);
            if (!evaluation) {
                throw new downward_evaluation_exceptions_1.DownwardEvaluationNotFoundException(evaluationId);
            }
            if (evaluation.완료되었는가()) {
                throw new downward_evaluation_exceptions_1.DownwardEvaluationAlreadyCompletedException(evaluationId);
            }
            if (!evaluation.downwardEvaluationContent ||
                !evaluation.downwardEvaluationScore) {
                throw new downward_evaluation_exceptions_1.DownwardEvaluationValidationException('평가 내용과 점수는 필수 입력 항목입니다.');
            }
            await this.downwardEvaluationService.수정한다(evaluationId, { isCompleted: true }, submittedBy);
            this.logger.log('하향평가 제출 완료', { evaluationId });
        });
    }
};
exports.SubmitDownwardEvaluationHandler = SubmitDownwardEvaluationHandler;
exports.SubmitDownwardEvaluationHandler = SubmitDownwardEvaluationHandler = SubmitDownwardEvaluationHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(SubmitDownwardEvaluationCommand),
    __metadata("design:paramtypes", [downward_evaluation_service_1.DownwardEvaluationService,
        transaction_manager_service_1.TransactionManagerService])
], SubmitDownwardEvaluationHandler);
//# sourceMappingURL=submit-downward-evaluation.handler.js.map