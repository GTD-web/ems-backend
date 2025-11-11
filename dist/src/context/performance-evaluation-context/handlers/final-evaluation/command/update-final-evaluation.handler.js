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
var UpdateFinalEvaluationHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateFinalEvaluationHandler = exports.UpdateFinalEvaluationCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const final_evaluation_service_1 = require("../../../../../domain/core/final-evaluation/final-evaluation.service");
const transaction_manager_service_1 = require("../../../../../../libs/database/transaction-manager.service");
class UpdateFinalEvaluationCommand {
    id;
    evaluationGrade;
    jobGrade;
    jobDetailedGrade;
    finalComments;
    updatedBy;
    constructor(id, evaluationGrade, jobGrade, jobDetailedGrade, finalComments, updatedBy = '시스템') {
        this.id = id;
        this.evaluationGrade = evaluationGrade;
        this.jobGrade = jobGrade;
        this.jobDetailedGrade = jobDetailedGrade;
        this.finalComments = finalComments;
        this.updatedBy = updatedBy;
    }
}
exports.UpdateFinalEvaluationCommand = UpdateFinalEvaluationCommand;
let UpdateFinalEvaluationHandler = UpdateFinalEvaluationHandler_1 = class UpdateFinalEvaluationHandler {
    finalEvaluationService;
    transactionManager;
    logger = new common_1.Logger(UpdateFinalEvaluationHandler_1.name);
    constructor(finalEvaluationService, transactionManager) {
        this.finalEvaluationService = finalEvaluationService;
        this.transactionManager = transactionManager;
    }
    async execute(command) {
        const { id, evaluationGrade, jobGrade, jobDetailedGrade, finalComments, updatedBy, } = command;
        this.logger.log('최종평가 수정 핸들러 실행', {
            id,
            evaluationGrade,
            jobGrade,
            jobDetailedGrade,
        });
        await this.transactionManager.executeTransaction(async (manager) => {
            await this.finalEvaluationService.수정한다(id, {
                evaluationGrade,
                jobGrade,
                jobDetailedGrade,
                finalComments,
            }, updatedBy, manager);
            this.logger.log('최종평가 수정 완료', { id });
        });
    }
};
exports.UpdateFinalEvaluationHandler = UpdateFinalEvaluationHandler;
exports.UpdateFinalEvaluationHandler = UpdateFinalEvaluationHandler = UpdateFinalEvaluationHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(UpdateFinalEvaluationCommand),
    __metadata("design:paramtypes", [final_evaluation_service_1.FinalEvaluationService,
        transaction_manager_service_1.TransactionManagerService])
], UpdateFinalEvaluationHandler);
//# sourceMappingURL=update-final-evaluation.handler.js.map