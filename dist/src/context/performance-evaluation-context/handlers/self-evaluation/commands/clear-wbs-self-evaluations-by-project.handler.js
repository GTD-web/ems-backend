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
var ClearWbsSelfEvaluationsByProjectHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClearWbsSelfEvaluationsByProjectHandler = exports.ClearWbsSelfEvaluationsByProjectCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const transaction_manager_service_1 = require("../../../../../../libs/database/transaction-manager.service");
const wbs_self_evaluation_entity_1 = require("../../../../../domain/core/wbs-self-evaluation/wbs-self-evaluation.entity");
const evaluation_wbs_assignment_service_1 = require("../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service");
class ClearWbsSelfEvaluationsByProjectCommand {
    employeeId;
    periodId;
    projectId;
    clearedBy;
    constructor(employeeId, periodId, projectId, clearedBy) {
        this.employeeId = employeeId;
        this.periodId = periodId;
        this.projectId = projectId;
        this.clearedBy = clearedBy;
    }
}
exports.ClearWbsSelfEvaluationsByProjectCommand = ClearWbsSelfEvaluationsByProjectCommand;
let ClearWbsSelfEvaluationsByProjectHandler = ClearWbsSelfEvaluationsByProjectHandler_1 = class ClearWbsSelfEvaluationsByProjectHandler {
    wbsSelfEvaluationRepository;
    evaluationWbsAssignmentService;
    transactionManager;
    logger = new common_1.Logger(ClearWbsSelfEvaluationsByProjectHandler_1.name);
    constructor(wbsSelfEvaluationRepository, evaluationWbsAssignmentService, transactionManager) {
        this.wbsSelfEvaluationRepository = wbsSelfEvaluationRepository;
        this.evaluationWbsAssignmentService = evaluationWbsAssignmentService;
        this.transactionManager = transactionManager;
    }
    async execute(command) {
        this.logger.log(`프로젝트별 WBS 자기평가 내용 초기화: 직원=${command.employeeId}, 평가기간=${command.periodId}, 프로젝트=${command.projectId}`);
        return this.transactionManager.executeTransaction(async (manager) => {
            const repository = manager.getRepository(wbs_self_evaluation_entity_1.WbsSelfEvaluation);
            const wbsAssignments = await this.evaluationWbsAssignmentService.프로젝트_WBS별_조회한다(command.periodId, command.projectId, manager);
            const wbsItemIds = wbsAssignments.map((assignment) => assignment.wbsItemId);
            if (wbsItemIds.length === 0) {
                this.logger.warn(`프로젝트에 할당된 WBS 항목이 없습니다: 프로젝트=${command.projectId}`);
                return {
                    employeeId: command.employeeId,
                    periodId: command.periodId,
                    projectId: command.projectId,
                    clearedCount: 0,
                    clearedEvaluations: [],
                };
            }
            const evaluations = await repository
                .createQueryBuilder('evaluation')
                .where('evaluation.employeeId = :employeeId', {
                employeeId: command.employeeId,
            })
                .andWhere('evaluation.periodId = :periodId', {
                periodId: command.periodId,
            })
                .andWhere('evaluation.wbsItemId IN (:...wbsItemIds)', { wbsItemIds })
                .getMany();
            if (evaluations.length === 0) {
                this.logger.warn(`내용 초기화할 자기평가가 없습니다: 직원=${command.employeeId}, 평가기간=${command.periodId}, 프로젝트=${command.projectId}`);
                return {
                    employeeId: command.employeeId,
                    periodId: command.periodId,
                    projectId: command.projectId,
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
            this.logger.log(`프로젝트별 WBS 자기평가 내용 초기화 완료: ${clearedEvaluations.length}개`);
            return {
                employeeId: command.employeeId,
                periodId: command.periodId,
                projectId: command.projectId,
                clearedCount: clearedEvaluations.length,
                clearedEvaluations,
            };
        });
    }
};
exports.ClearWbsSelfEvaluationsByProjectHandler = ClearWbsSelfEvaluationsByProjectHandler;
exports.ClearWbsSelfEvaluationsByProjectHandler = ClearWbsSelfEvaluationsByProjectHandler = ClearWbsSelfEvaluationsByProjectHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(ClearWbsSelfEvaluationsByProjectCommand),
    __param(0, (0, typeorm_1.InjectRepository)(wbs_self_evaluation_entity_1.WbsSelfEvaluation)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        evaluation_wbs_assignment_service_1.EvaluationWbsAssignmentService,
        transaction_manager_service_1.TransactionManagerService])
], ClearWbsSelfEvaluationsByProjectHandler);
//# sourceMappingURL=clear-wbs-self-evaluations-by-project.handler.js.map