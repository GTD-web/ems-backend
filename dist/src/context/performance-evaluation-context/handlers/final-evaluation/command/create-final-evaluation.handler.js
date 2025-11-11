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
var CreateFinalEvaluationHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateFinalEvaluationHandler = exports.CreateFinalEvaluationCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const final_evaluation_service_1 = require("../../../../../domain/core/final-evaluation/final-evaluation.service");
const transaction_manager_service_1 = require("../../../../../../libs/database/transaction-manager.service");
class CreateFinalEvaluationCommand {
    employeeId;
    periodId;
    evaluationGrade;
    jobGrade;
    jobDetailedGrade;
    finalComments;
    createdBy;
    constructor(employeeId, periodId, evaluationGrade, jobGrade, jobDetailedGrade, finalComments, createdBy = '시스템') {
        this.employeeId = employeeId;
        this.periodId = periodId;
        this.evaluationGrade = evaluationGrade;
        this.jobGrade = jobGrade;
        this.jobDetailedGrade = jobDetailedGrade;
        this.finalComments = finalComments;
        this.createdBy = createdBy;
    }
}
exports.CreateFinalEvaluationCommand = CreateFinalEvaluationCommand;
let CreateFinalEvaluationHandler = CreateFinalEvaluationHandler_1 = class CreateFinalEvaluationHandler {
    finalEvaluationService;
    transactionManager;
    logger = new common_1.Logger(CreateFinalEvaluationHandler_1.name);
    constructor(finalEvaluationService, transactionManager) {
        this.finalEvaluationService = finalEvaluationService;
        this.transactionManager = transactionManager;
    }
    async execute(command) {
        const { employeeId, periodId, evaluationGrade, jobGrade, jobDetailedGrade, finalComments, createdBy, } = command;
        this.logger.log('최종평가 생성 핸들러 실행', {
            employeeId,
            periodId,
            evaluationGrade,
            jobGrade,
            jobDetailedGrade,
        });
        return await this.transactionManager.executeTransaction(async (manager) => {
            const evaluation = await this.finalEvaluationService.생성한다({
                employeeId,
                periodId,
                evaluationGrade,
                jobGrade,
                jobDetailedGrade,
                finalComments,
                createdBy,
            }, manager);
            this.logger.log('최종평가 생성 완료', { evaluationId: evaluation.id });
            return evaluation.id;
        });
    }
};
exports.CreateFinalEvaluationHandler = CreateFinalEvaluationHandler;
exports.CreateFinalEvaluationHandler = CreateFinalEvaluationHandler = CreateFinalEvaluationHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(CreateFinalEvaluationCommand),
    __metadata("design:paramtypes", [final_evaluation_service_1.FinalEvaluationService,
        transaction_manager_service_1.TransactionManagerService])
], CreateFinalEvaluationHandler);
//# sourceMappingURL=create-final-evaluation.handler.js.map