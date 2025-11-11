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
var CreateDownwardEvaluationHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateDownwardEvaluationHandler = exports.CreateDownwardEvaluationCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const downward_evaluation_service_1 = require("../../../../../domain/core/downward-evaluation/downward-evaluation.service");
const transaction_manager_service_1 = require("../../../../../../libs/database/transaction-manager.service");
class CreateDownwardEvaluationCommand {
    evaluatorId;
    evaluateeId;
    periodId;
    wbsId;
    selfEvaluationId;
    evaluationType;
    downwardEvaluationContent;
    downwardEvaluationScore;
    createdBy;
    constructor(evaluatorId, evaluateeId, periodId, wbsId, selfEvaluationId, evaluationType = 'primary', downwardEvaluationContent, downwardEvaluationScore, createdBy = '시스템') {
        this.evaluatorId = evaluatorId;
        this.evaluateeId = evaluateeId;
        this.periodId = periodId;
        this.wbsId = wbsId;
        this.selfEvaluationId = selfEvaluationId;
        this.evaluationType = evaluationType;
        this.downwardEvaluationContent = downwardEvaluationContent;
        this.downwardEvaluationScore = downwardEvaluationScore;
        this.createdBy = createdBy;
    }
}
exports.CreateDownwardEvaluationCommand = CreateDownwardEvaluationCommand;
let CreateDownwardEvaluationHandler = CreateDownwardEvaluationHandler_1 = class CreateDownwardEvaluationHandler {
    downwardEvaluationService;
    transactionManager;
    logger = new common_1.Logger(CreateDownwardEvaluationHandler_1.name);
    constructor(downwardEvaluationService, transactionManager) {
        this.downwardEvaluationService = downwardEvaluationService;
        this.transactionManager = transactionManager;
    }
    async execute(command) {
        const { evaluatorId, evaluateeId, periodId, wbsId, selfEvaluationId, evaluationType, downwardEvaluationContent, downwardEvaluationScore, createdBy, } = command;
        this.logger.log('하향평가 생성 핸들러 실행', {
            evaluatorId,
            evaluateeId,
            periodId,
            wbsId,
            evaluationType,
        });
        return await this.transactionManager.executeTransaction(async () => {
            const evaluation = await this.downwardEvaluationService.생성한다({
                employeeId: evaluateeId,
                evaluatorId,
                wbsId,
                periodId,
                selfEvaluationId,
                downwardEvaluationContent,
                downwardEvaluationScore,
                evaluationDate: new Date(),
                evaluationType: evaluationType,
                isCompleted: false,
                createdBy,
            });
            this.logger.log('하향평가 생성 완료', { evaluationId: evaluation.id });
            return evaluation.id;
        });
    }
};
exports.CreateDownwardEvaluationHandler = CreateDownwardEvaluationHandler;
exports.CreateDownwardEvaluationHandler = CreateDownwardEvaluationHandler = CreateDownwardEvaluationHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(CreateDownwardEvaluationCommand),
    __metadata("design:paramtypes", [downward_evaluation_service_1.DownwardEvaluationService,
        transaction_manager_service_1.TransactionManagerService])
], CreateDownwardEvaluationHandler);
//# sourceMappingURL=create-downward-evaluation.handler.js.map