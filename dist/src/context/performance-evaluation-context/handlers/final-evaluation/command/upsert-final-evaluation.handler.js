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
var UpsertFinalEvaluationHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpsertFinalEvaluationHandler = exports.UpsertFinalEvaluationCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const final_evaluation_service_1 = require("../../../../../domain/core/final-evaluation/final-evaluation.service");
const final_evaluation_entity_1 = require("../../../../../domain/core/final-evaluation/final-evaluation.entity");
const transaction_manager_service_1 = require("../../../../../../libs/database/transaction-manager.service");
class UpsertFinalEvaluationCommand {
    employeeId;
    periodId;
    evaluationGrade;
    jobGrade;
    jobDetailedGrade;
    finalComments;
    actionBy;
    constructor(employeeId, periodId, evaluationGrade, jobGrade, jobDetailedGrade, finalComments, actionBy = '시스템') {
        this.employeeId = employeeId;
        this.periodId = periodId;
        this.evaluationGrade = evaluationGrade;
        this.jobGrade = jobGrade;
        this.jobDetailedGrade = jobDetailedGrade;
        this.finalComments = finalComments;
        this.actionBy = actionBy;
    }
}
exports.UpsertFinalEvaluationCommand = UpsertFinalEvaluationCommand;
let UpsertFinalEvaluationHandler = UpsertFinalEvaluationHandler_1 = class UpsertFinalEvaluationHandler {
    finalEvaluationService;
    finalEvaluationRepository;
    transactionManager;
    logger = new common_1.Logger(UpsertFinalEvaluationHandler_1.name);
    constructor(finalEvaluationService, finalEvaluationRepository, transactionManager) {
        this.finalEvaluationService = finalEvaluationService;
        this.finalEvaluationRepository = finalEvaluationRepository;
        this.transactionManager = transactionManager;
    }
    async execute(command) {
        const { employeeId, periodId, evaluationGrade, jobGrade, jobDetailedGrade, finalComments, actionBy, } = command;
        this.logger.log('최종평가 Upsert 핸들러 실행', {
            employeeId,
            periodId,
            evaluationGrade,
            jobGrade,
            jobDetailedGrade,
        });
        return await this.transactionManager.executeTransaction(async (manager) => {
            const existingEvaluation = await this.finalEvaluationRepository.findOne({
                where: {
                    employeeId,
                    periodId,
                },
            });
            if (existingEvaluation) {
                this.logger.log('기존 최종평가 발견 - 수정 진행', {
                    evaluationId: existingEvaluation.id,
                });
                await this.finalEvaluationService.수정한다(existingEvaluation.id, {
                    evaluationGrade,
                    jobGrade,
                    jobDetailedGrade,
                    finalComments,
                }, actionBy, manager);
                this.logger.log('최종평가 수정 완료', {
                    evaluationId: existingEvaluation.id,
                });
                return existingEvaluation.id;
            }
            else {
                this.logger.log('기존 최종평가 없음 - 생성 진행');
                const newEvaluation = await this.finalEvaluationService.생성한다({
                    employeeId,
                    periodId,
                    evaluationGrade,
                    jobGrade,
                    jobDetailedGrade,
                    finalComments,
                    createdBy: actionBy,
                }, manager);
                this.logger.log('최종평가 생성 완료', {
                    evaluationId: newEvaluation.id,
                });
                return newEvaluation.id;
            }
        });
    }
};
exports.UpsertFinalEvaluationHandler = UpsertFinalEvaluationHandler;
exports.UpsertFinalEvaluationHandler = UpsertFinalEvaluationHandler = UpsertFinalEvaluationHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(UpsertFinalEvaluationCommand),
    __param(1, (0, typeorm_1.InjectRepository)(final_evaluation_entity_1.FinalEvaluation)),
    __metadata("design:paramtypes", [final_evaluation_service_1.FinalEvaluationService,
        typeorm_2.Repository,
        transaction_manager_service_1.TransactionManagerService])
], UpsertFinalEvaluationHandler);
//# sourceMappingURL=upsert-final-evaluation.handler.js.map