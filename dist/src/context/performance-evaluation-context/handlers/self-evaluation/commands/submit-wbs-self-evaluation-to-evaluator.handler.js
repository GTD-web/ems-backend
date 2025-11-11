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
var SubmitWbsSelfEvaluationToEvaluatorHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmitWbsSelfEvaluationToEvaluatorHandler = exports.SubmitWbsSelfEvaluationToEvaluatorCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const wbs_self_evaluation_service_1 = require("../../../../../domain/core/wbs-self-evaluation/wbs-self-evaluation.service");
const transaction_manager_service_1 = require("../../../../../../libs/database/transaction-manager.service");
const evaluation_period_service_1 = require("../../../../../domain/core/evaluation-period/evaluation-period.service");
class SubmitWbsSelfEvaluationToEvaluatorCommand {
    evaluationId;
    submittedBy;
    constructor(evaluationId, submittedBy = '시스템') {
        this.evaluationId = evaluationId;
        this.submittedBy = submittedBy;
    }
}
exports.SubmitWbsSelfEvaluationToEvaluatorCommand = SubmitWbsSelfEvaluationToEvaluatorCommand;
let SubmitWbsSelfEvaluationToEvaluatorHandler = SubmitWbsSelfEvaluationToEvaluatorHandler_1 = class SubmitWbsSelfEvaluationToEvaluatorHandler {
    wbsSelfEvaluationService;
    evaluationPeriodService;
    transactionManager;
    logger = new common_1.Logger(SubmitWbsSelfEvaluationToEvaluatorHandler_1.name);
    constructor(wbsSelfEvaluationService, evaluationPeriodService, transactionManager) {
        this.wbsSelfEvaluationService = wbsSelfEvaluationService;
        this.evaluationPeriodService = evaluationPeriodService;
        this.transactionManager = transactionManager;
    }
    async execute(command) {
        const { evaluationId, submittedBy } = command;
        this.logger.log('WBS 자기평가 제출 핸들러 실행 (피평가자 → 1차 평가자)', { evaluationId });
        return await this.transactionManager.executeTransaction(async () => {
            const evaluation = await this.wbsSelfEvaluationService.조회한다(evaluationId);
            if (!evaluation) {
                throw new common_1.NotFoundException(`자기평가를 찾을 수 없습니다. (ID: ${evaluationId})`);
            }
            if (!evaluation.selfEvaluationContent ||
                !evaluation.selfEvaluationScore) {
                throw new common_1.BadRequestException('평가 내용과 점수는 필수 입력 항목입니다.');
            }
            const evaluationPeriod = await this.evaluationPeriodService.ID로_조회한다(evaluation.periodId);
            if (!evaluationPeriod) {
                throw new common_1.BadRequestException(`평가기간을 찾을 수 없습니다. (periodId: ${evaluation.periodId})`);
            }
            const maxScore = evaluationPeriod.자기평가_달성률_최대값();
            if (!evaluation.점수가_유효한가(maxScore)) {
                throw new common_1.BadRequestException(`평가 점수가 유효하지 않습니다 (0 ~ ${maxScore} 사이여야 함).`);
            }
            await this.wbsSelfEvaluationService.피평가자가_1차평가자에게_제출한다(evaluation, submittedBy);
            const updatedEvaluation = await this.wbsSelfEvaluationService.조회한다(evaluationId);
            if (!updatedEvaluation) {
                throw new common_1.NotFoundException(`자기평가를 찾을 수 없습니다. (ID: ${evaluationId})`);
            }
            this.logger.log('WBS 자기평가 제출 완료 (피평가자 → 1차 평가자)', {
                evaluationId,
                submittedToEvaluator: updatedEvaluation.submittedToEvaluator,
            });
            return updatedEvaluation.DTO로_변환한다();
        });
    }
};
exports.SubmitWbsSelfEvaluationToEvaluatorHandler = SubmitWbsSelfEvaluationToEvaluatorHandler;
exports.SubmitWbsSelfEvaluationToEvaluatorHandler = SubmitWbsSelfEvaluationToEvaluatorHandler = SubmitWbsSelfEvaluationToEvaluatorHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(SubmitWbsSelfEvaluationToEvaluatorCommand),
    __metadata("design:paramtypes", [wbs_self_evaluation_service_1.WbsSelfEvaluationService,
        evaluation_period_service_1.EvaluationPeriodService,
        transaction_manager_service_1.TransactionManagerService])
], SubmitWbsSelfEvaluationToEvaluatorHandler);
//# sourceMappingURL=submit-wbs-self-evaluation-to-evaluator.handler.js.map