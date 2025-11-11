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
var SubmitAllWbsSelfEvaluationsByEmployeePeriodHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmitAllWbsSelfEvaluationsByEmployeePeriodHandler = exports.SubmitAllWbsSelfEvaluationsByEmployeePeriodCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const wbs_self_evaluation_service_1 = require("../../../../../domain/core/wbs-self-evaluation/wbs-self-evaluation.service");
const transaction_manager_service_1 = require("../../../../../../libs/database/transaction-manager.service");
const evaluation_period_service_1 = require("../../../../../domain/core/evaluation-period/evaluation-period.service");
class SubmitAllWbsSelfEvaluationsByEmployeePeriodCommand {
    employeeId;
    periodId;
    submittedBy;
    constructor(employeeId, periodId, submittedBy = '시스템') {
        this.employeeId = employeeId;
        this.periodId = periodId;
        this.submittedBy = submittedBy;
    }
}
exports.SubmitAllWbsSelfEvaluationsByEmployeePeriodCommand = SubmitAllWbsSelfEvaluationsByEmployeePeriodCommand;
let SubmitAllWbsSelfEvaluationsByEmployeePeriodHandler = SubmitAllWbsSelfEvaluationsByEmployeePeriodHandler_1 = class SubmitAllWbsSelfEvaluationsByEmployeePeriodHandler {
    wbsSelfEvaluationService;
    evaluationPeriodService;
    transactionManager;
    logger = new common_1.Logger(SubmitAllWbsSelfEvaluationsByEmployeePeriodHandler_1.name);
    constructor(wbsSelfEvaluationService, evaluationPeriodService, transactionManager) {
        this.wbsSelfEvaluationService = wbsSelfEvaluationService;
        this.evaluationPeriodService = evaluationPeriodService;
        this.transactionManager = transactionManager;
    }
    async execute(command) {
        const { employeeId, periodId, submittedBy } = command;
        this.logger.log('직원의 전체 WBS 자기평가 제출 시작 (1차 평가자 → 관리자)', {
            employeeId,
            periodId,
        });
        return await this.transactionManager.executeTransaction(async () => {
            const evaluationPeriod = await this.evaluationPeriodService.ID로_조회한다(periodId);
            if (!evaluationPeriod) {
                throw new common_1.BadRequestException(`평가기간을 찾을 수 없습니다. (periodId: ${periodId})`);
            }
            const maxScore = evaluationPeriod.자기평가_달성률_최대값();
            const evaluations = await this.wbsSelfEvaluationService.필터_조회한다({
                employeeId,
                periodId,
            });
            if (evaluations.length === 0) {
                throw new common_1.BadRequestException('제출할 자기평가가 존재하지 않습니다.');
            }
            const completedEvaluations = [];
            const failedEvaluations = [];
            for (const evaluation of evaluations) {
                try {
                    if (evaluation.일차평가자가_관리자에게_제출했는가()) {
                        this.logger.debug(`이미 관리자에게 제출된 평가 스킵 - ID: ${evaluation.id}`);
                        completedEvaluations.push({
                            evaluationId: evaluation.id,
                            wbsItemId: evaluation.wbsItemId,
                            selfEvaluationContent: evaluation.selfEvaluationContent,
                            selfEvaluationScore: evaluation.selfEvaluationScore,
                            performanceResult: evaluation.performanceResult,
                            submittedToManagerAt: evaluation.submittedToManagerAt,
                        });
                        continue;
                    }
                    if (!evaluation.피평가자가_1차평가자에게_제출했는가()) {
                        failedEvaluations.push({
                            evaluationId: evaluation.id,
                            wbsItemId: evaluation.wbsItemId,
                            reason: '피평가자가 1차 평가자에게 먼저 제출해야 합니다.',
                            selfEvaluationContent: evaluation.selfEvaluationContent,
                            selfEvaluationScore: evaluation.selfEvaluationScore,
                        });
                        continue;
                    }
                    if (!evaluation.selfEvaluationContent ||
                        !evaluation.selfEvaluationScore) {
                        failedEvaluations.push({
                            evaluationId: evaluation.id,
                            wbsItemId: evaluation.wbsItemId,
                            reason: '평가 내용과 점수가 입력되지 않았습니다.',
                            selfEvaluationContent: evaluation.selfEvaluationContent,
                            selfEvaluationScore: evaluation.selfEvaluationScore,
                        });
                        continue;
                    }
                    if (!evaluation.점수가_유효한가(maxScore)) {
                        failedEvaluations.push({
                            evaluationId: evaluation.id,
                            wbsItemId: evaluation.wbsItemId,
                            reason: `평가 점수가 유효하지 않습니다 (0 ~ ${maxScore} 사이여야 함).`,
                            selfEvaluationContent: evaluation.selfEvaluationContent,
                            selfEvaluationScore: evaluation.selfEvaluationScore,
                        });
                        continue;
                    }
                    const updatedEvaluation = await this.wbsSelfEvaluationService.수정한다(evaluation.id, { submittedToManager: true }, submittedBy);
                    completedEvaluations.push({
                        evaluationId: updatedEvaluation.id,
                        wbsItemId: updatedEvaluation.wbsItemId,
                        selfEvaluationContent: updatedEvaluation.selfEvaluationContent,
                        selfEvaluationScore: updatedEvaluation.selfEvaluationScore,
                        performanceResult: updatedEvaluation.performanceResult,
                        submittedToManagerAt: updatedEvaluation.submittedToManagerAt,
                    });
                    this.logger.debug(`평가 완료 처리 성공 - ID: ${evaluation.id}`);
                }
                catch (error) {
                    this.logger.error(`평가 완료 처리 실패 - ID: ${evaluation.id}`, error);
                    failedEvaluations.push({
                        evaluationId: evaluation.id,
                        wbsItemId: evaluation.wbsItemId,
                        reason: error.message || '알 수 없는 오류가 발생했습니다.',
                        selfEvaluationContent: evaluation.selfEvaluationContent,
                        selfEvaluationScore: evaluation.selfEvaluationScore,
                    });
                }
            }
            const result = {
                submittedCount: completedEvaluations.length,
                failedCount: failedEvaluations.length,
                totalCount: evaluations.length,
                completedEvaluations,
                failedEvaluations,
            };
            this.logger.log('직원의 전체 WBS 자기평가 제출 완료 (1차 평가자 → 관리자)', {
                employeeId,
                periodId,
                submittedCount: result.submittedCount,
                failedCount: result.failedCount,
            });
            if (failedEvaluations.length > 0) {
                this.logger.warn('일부 평가 제출 실패', {
                    failedCount: failedEvaluations.length,
                    failures: failedEvaluations,
                });
            }
            return result;
        });
    }
};
exports.SubmitAllWbsSelfEvaluationsByEmployeePeriodHandler = SubmitAllWbsSelfEvaluationsByEmployeePeriodHandler;
exports.SubmitAllWbsSelfEvaluationsByEmployeePeriodHandler = SubmitAllWbsSelfEvaluationsByEmployeePeriodHandler = SubmitAllWbsSelfEvaluationsByEmployeePeriodHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(SubmitAllWbsSelfEvaluationsByEmployeePeriodCommand),
    __metadata("design:paramtypes", [wbs_self_evaluation_service_1.WbsSelfEvaluationService,
        evaluation_period_service_1.EvaluationPeriodService,
        transaction_manager_service_1.TransactionManagerService])
], SubmitAllWbsSelfEvaluationsByEmployeePeriodHandler);
//# sourceMappingURL=submit-all-wbs-self-evaluations.handler.js.map