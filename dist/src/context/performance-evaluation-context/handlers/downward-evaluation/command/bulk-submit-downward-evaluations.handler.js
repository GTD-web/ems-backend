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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var BulkSubmitDownwardEvaluationsHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BulkSubmitDownwardEvaluationsHandler = exports.BulkSubmitDownwardEvaluationsCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const downward_evaluation_entity_1 = require("../../../../../domain/core/downward-evaluation/downward-evaluation.entity");
const downward_evaluation_service_1 = require("../../../../../domain/core/downward-evaluation/downward-evaluation.service");
const transaction_manager_service_1 = require("../../../../../../libs/database/transaction-manager.service");
class BulkSubmitDownwardEvaluationsCommand {
    evaluatorId;
    evaluateeId;
    periodId;
    evaluationType;
    submittedBy;
    constructor(evaluatorId, evaluateeId, periodId, evaluationType, submittedBy = '시스템') {
        this.evaluatorId = evaluatorId;
        this.evaluateeId = evaluateeId;
        this.periodId = periodId;
        this.evaluationType = evaluationType;
        this.submittedBy = submittedBy;
    }
}
exports.BulkSubmitDownwardEvaluationsCommand = BulkSubmitDownwardEvaluationsCommand;
let BulkSubmitDownwardEvaluationsHandler = BulkSubmitDownwardEvaluationsHandler_1 = class BulkSubmitDownwardEvaluationsHandler {
    downwardEvaluationRepository;
    downwardEvaluationService;
    transactionManager;
    logger = new common_1.Logger(BulkSubmitDownwardEvaluationsHandler_1.name);
    constructor(downwardEvaluationRepository, downwardEvaluationService, transactionManager) {
        this.downwardEvaluationRepository = downwardEvaluationRepository;
        this.downwardEvaluationService = downwardEvaluationService;
        this.transactionManager = transactionManager;
    }
    async execute(command) {
        const { evaluatorId, evaluateeId, periodId, evaluationType, submittedBy } = command;
        this.logger.log('피평가자의 모든 하향평가 일괄 제출 핸들러 실행', {
            evaluatorId,
            evaluateeId,
            periodId,
            evaluationType,
        });
        return await this.transactionManager.executeTransaction(async () => {
            const evaluations = await this.downwardEvaluationRepository.find({
                where: {
                    evaluatorId,
                    employeeId: evaluateeId,
                    periodId,
                    evaluationType,
                    deletedAt: null,
                },
            });
            if (evaluations.length === 0) {
                this.logger.debug(`하향평가가 없어 제출을 건너뜀 - 평가자: ${evaluatorId}, 피평가자: ${evaluateeId}, 평가기간: ${periodId}, 평가유형: ${evaluationType}`);
                return {
                    submittedCount: 0,
                    skippedCount: 0,
                    failedCount: 0,
                    submittedIds: [],
                    skippedIds: [],
                    failedItems: [],
                };
            }
            const submittedIds = [];
            const skippedIds = [];
            const failedItems = [];
            for (const evaluation of evaluations) {
                try {
                    if (evaluation.완료되었는가()) {
                        skippedIds.push(evaluation.id);
                        this.logger.debug(`이미 완료된 평가는 건너뜀: ${evaluation.id}`);
                        continue;
                    }
                    if (!evaluation.downwardEvaluationContent ||
                        !evaluation.downwardEvaluationScore) {
                        failedItems.push({
                            evaluationId: evaluation.id,
                            error: '평가 내용과 점수는 필수 입력 항목입니다.',
                        });
                        this.logger.warn(`필수 항목 누락으로 제출 실패: ${evaluation.id}`);
                        continue;
                    }
                    await this.downwardEvaluationService.수정한다(evaluation.id, { isCompleted: true }, submittedBy);
                    submittedIds.push(evaluation.id);
                    this.logger.debug(`하향평가 제출 완료: ${evaluation.id}`);
                }
                catch (error) {
                    failedItems.push({
                        evaluationId: evaluation.id,
                        error: error instanceof Error ? error.message : String(error),
                    });
                    this.logger.error(`하향평가 제출 실패: ${evaluation.id}`, error instanceof Error ? error.stack : undefined);
                }
            }
            const result = {
                submittedCount: submittedIds.length,
                skippedCount: skippedIds.length,
                failedCount: failedItems.length,
                submittedIds,
                skippedIds,
                failedItems,
            };
            this.logger.log('피평가자의 모든 하향평가 일괄 제출 완료', {
                totalCount: evaluations.length,
                ...result,
            });
            return result;
        });
    }
};
exports.BulkSubmitDownwardEvaluationsHandler = BulkSubmitDownwardEvaluationsHandler;
exports.BulkSubmitDownwardEvaluationsHandler = BulkSubmitDownwardEvaluationsHandler = BulkSubmitDownwardEvaluationsHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(BulkSubmitDownwardEvaluationsCommand),
    __param(0, (0, typeorm_1.InjectRepository)(downward_evaluation_entity_1.DownwardEvaluation)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        downward_evaluation_service_1.DownwardEvaluationService,
        transaction_manager_service_1.TransactionManagerService])
], BulkSubmitDownwardEvaluationsHandler);
//# sourceMappingURL=bulk-submit-downward-evaluations.handler.js.map