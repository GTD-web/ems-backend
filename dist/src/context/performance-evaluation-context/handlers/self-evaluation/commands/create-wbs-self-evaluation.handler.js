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
var CreateWbsSelfEvaluationHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateWbsSelfEvaluationHandler = exports.CreateWbsSelfEvaluationCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const wbs_self_evaluation_service_1 = require("../../../../../domain/core/wbs-self-evaluation/wbs-self-evaluation.service");
const transaction_manager_service_1 = require("../../../../../../libs/database/transaction-manager.service");
class CreateWbsSelfEvaluationCommand {
    periodId;
    employeeId;
    wbsItemId;
    selfEvaluationContent;
    selfEvaluationScore;
    performanceResult;
    createdBy;
    constructor(periodId, employeeId, wbsItemId, selfEvaluationContent, selfEvaluationScore, performanceResult, createdBy = '시스템') {
        this.periodId = periodId;
        this.employeeId = employeeId;
        this.wbsItemId = wbsItemId;
        this.selfEvaluationContent = selfEvaluationContent;
        this.selfEvaluationScore = selfEvaluationScore;
        this.performanceResult = performanceResult;
        this.createdBy = createdBy;
    }
}
exports.CreateWbsSelfEvaluationCommand = CreateWbsSelfEvaluationCommand;
let CreateWbsSelfEvaluationHandler = CreateWbsSelfEvaluationHandler_1 = class CreateWbsSelfEvaluationHandler {
    wbsSelfEvaluationService;
    transactionManager;
    logger = new common_1.Logger(CreateWbsSelfEvaluationHandler_1.name);
    constructor(wbsSelfEvaluationService, transactionManager) {
        this.wbsSelfEvaluationService = wbsSelfEvaluationService;
        this.transactionManager = transactionManager;
    }
    async execute(command) {
        const { periodId, employeeId, wbsItemId, selfEvaluationContent, selfEvaluationScore, performanceResult, createdBy, } = command;
        this.logger.log('WBS 자기평가 생성 핸들러 실행', {
            periodId,
            employeeId,
            wbsItemId,
        });
        return await this.transactionManager.executeTransaction(async () => {
            const evaluation = await this.wbsSelfEvaluationService.생성한다({
                periodId,
                employeeId,
                wbsItemId,
                assignedBy: createdBy,
                selfEvaluationContent,
                selfEvaluationScore,
                performanceResult,
                createdBy,
            });
            this.logger.log('WBS 자기평가 생성 완료', {
                evaluationId: evaluation.id,
            });
            return evaluation.DTO로_변환한다();
        });
    }
};
exports.CreateWbsSelfEvaluationHandler = CreateWbsSelfEvaluationHandler;
exports.CreateWbsSelfEvaluationHandler = CreateWbsSelfEvaluationHandler = CreateWbsSelfEvaluationHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(CreateWbsSelfEvaluationCommand),
    __metadata("design:paramtypes", [wbs_self_evaluation_service_1.WbsSelfEvaluationService,
        transaction_manager_service_1.TransactionManagerService])
], CreateWbsSelfEvaluationHandler);
//# sourceMappingURL=create-wbs-self-evaluation.handler.js.map