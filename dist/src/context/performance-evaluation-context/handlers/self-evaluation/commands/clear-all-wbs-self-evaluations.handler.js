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
var ClearAllWbsSelfEvaluationsByEmployeePeriodHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClearAllWbsSelfEvaluationsByEmployeePeriodHandler = exports.ClearAllWbsSelfEvaluationsByEmployeePeriodCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const transaction_manager_service_1 = require("../../../../../../libs/database/transaction-manager.service");
const wbs_self_evaluation_entity_1 = require("../../../../../domain/core/wbs-self-evaluation/wbs-self-evaluation.entity");
class ClearAllWbsSelfEvaluationsByEmployeePeriodCommand {
    employeeId;
    periodId;
    clearedBy;
    constructor(employeeId, periodId, clearedBy) {
        this.employeeId = employeeId;
        this.periodId = periodId;
        this.clearedBy = clearedBy;
    }
}
exports.ClearAllWbsSelfEvaluationsByEmployeePeriodCommand = ClearAllWbsSelfEvaluationsByEmployeePeriodCommand;
let ClearAllWbsSelfEvaluationsByEmployeePeriodHandler = ClearAllWbsSelfEvaluationsByEmployeePeriodHandler_1 = class ClearAllWbsSelfEvaluationsByEmployeePeriodHandler {
    wbsSelfEvaluationRepository;
    transactionManager;
    logger = new common_1.Logger(ClearAllWbsSelfEvaluationsByEmployeePeriodHandler_1.name);
    constructor(wbsSelfEvaluationRepository, transactionManager) {
        this.wbsSelfEvaluationRepository = wbsSelfEvaluationRepository;
        this.transactionManager = transactionManager;
    }
    async execute(command) {
        this.logger.log(`직원의 전체 WBS 자기평가 내용 초기화: 직원=${command.employeeId}, 평가기간=${command.periodId}`);
        return this.transactionManager.executeTransaction(async (manager) => {
            const repository = manager.getRepository(wbs_self_evaluation_entity_1.WbsSelfEvaluation);
            const evaluations = await repository.find({
                where: {
                    employeeId: command.employeeId,
                    periodId: command.periodId,
                },
            });
            if (evaluations.length === 0) {
                this.logger.warn(`내용 초기화할 자기평가가 없습니다: 직원=${command.employeeId}, 평가기간=${command.periodId}`);
                return {
                    employeeId: command.employeeId,
                    periodId: command.periodId,
                    clearedCount: 0,
                    clearedEvaluations: [],
                };
            }
            const clearedEvaluations = [];
            for (const evaluation of evaluations) {
                evaluation.자가평가_내용을_초기화한다(command.clearedBy);
                await repository.save(evaluation);
                clearedEvaluations.push({
                    id: evaluation.id,
                    wbsItemId: evaluation.wbsItemId,
                    selfEvaluationContent: evaluation.selfEvaluationContent,
                    selfEvaluationScore: evaluation.selfEvaluationScore,
                    performanceResult: evaluation.performanceResult,
                });
            }
            this.logger.log(`직원의 전체 WBS 자기평가 내용 초기화 완료: ${clearedEvaluations.length}개`);
            return {
                employeeId: command.employeeId,
                periodId: command.periodId,
                clearedCount: clearedEvaluations.length,
                clearedEvaluations,
            };
        });
    }
};
exports.ClearAllWbsSelfEvaluationsByEmployeePeriodHandler = ClearAllWbsSelfEvaluationsByEmployeePeriodHandler;
exports.ClearAllWbsSelfEvaluationsByEmployeePeriodHandler = ClearAllWbsSelfEvaluationsByEmployeePeriodHandler = ClearAllWbsSelfEvaluationsByEmployeePeriodHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(ClearAllWbsSelfEvaluationsByEmployeePeriodCommand),
    __param(0, (0, typeorm_1.InjectRepository)(wbs_self_evaluation_entity_1.WbsSelfEvaluation)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        transaction_manager_service_1.TransactionManagerService])
], ClearAllWbsSelfEvaluationsByEmployeePeriodHandler);
//# sourceMappingURL=clear-all-wbs-self-evaluations.handler.js.map