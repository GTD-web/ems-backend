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
var BulkResetDownwardEvaluationsHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BulkResetDownwardEvaluationsHandler = exports.BulkResetDownwardEvaluationsCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const downward_evaluation_entity_1 = require("../../../../../domain/core/downward-evaluation/downward-evaluation.entity");
const downward_evaluation_service_1 = require("../../../../../domain/core/downward-evaluation/downward-evaluation.service");
const downward_evaluation_exceptions_1 = require("../../../../../domain/core/downward-evaluation/downward-evaluation.exceptions");
const transaction_manager_service_1 = require("../../../../../../libs/database/transaction-manager.service");
const downward_evaluation_types_1 = require("../../../../../domain/core/downward-evaluation/downward-evaluation.types");
const evaluation_period_employee_mapping_entity_1 = require("../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity");
const employee_evaluation_step_approval_service_1 = require("../../../../../domain/sub/employee-evaluation-step-approval/employee-evaluation-step-approval.service");
const employee_evaluation_step_approval_types_1 = require("../../../../../domain/sub/employee-evaluation-step-approval/employee-evaluation-step-approval.types");
class BulkResetDownwardEvaluationsCommand {
    evaluatorId;
    evaluateeId;
    periodId;
    evaluationType;
    resetBy;
    constructor(evaluatorId, evaluateeId, periodId, evaluationType, resetBy = '시스템') {
        this.evaluatorId = evaluatorId;
        this.evaluateeId = evaluateeId;
        this.periodId = periodId;
        this.evaluationType = evaluationType;
        this.resetBy = resetBy;
    }
}
exports.BulkResetDownwardEvaluationsCommand = BulkResetDownwardEvaluationsCommand;
let BulkResetDownwardEvaluationsHandler = BulkResetDownwardEvaluationsHandler_1 = class BulkResetDownwardEvaluationsHandler {
    downwardEvaluationRepository;
    mappingRepository;
    downwardEvaluationService;
    transactionManager;
    stepApprovalService;
    logger = new common_1.Logger(BulkResetDownwardEvaluationsHandler_1.name);
    constructor(downwardEvaluationRepository, mappingRepository, downwardEvaluationService, transactionManager, stepApprovalService) {
        this.downwardEvaluationRepository = downwardEvaluationRepository;
        this.mappingRepository = mappingRepository;
        this.downwardEvaluationService = downwardEvaluationService;
        this.transactionManager = transactionManager;
        this.stepApprovalService = stepApprovalService;
    }
    async execute(command) {
        const { evaluatorId, evaluateeId, periodId, evaluationType, resetBy } = command;
        this.logger.log('피평가자의 모든 하향평가 일괄 초기화 핸들러 실행', {
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
                throw new downward_evaluation_exceptions_1.DownwardEvaluationNotFoundException(`하향평가를 찾을 수 없습니다. (evaluatorId: ${evaluatorId}, evaluateeId: ${evaluateeId}, periodId: ${periodId}, evaluationType: ${evaluationType})`);
            }
            const resetIds = [];
            const skippedIds = [];
            const failedItems = [];
            for (const evaluation of evaluations) {
                try {
                    if (!evaluation.완료되었는가()) {
                        skippedIds.push(evaluation.id);
                        this.logger.debug(`이미 미제출 상태인 평가는 건너뜀: ${evaluation.id}`);
                        continue;
                    }
                    await this.downwardEvaluationService.수정한다(evaluation.id, { isCompleted: false }, resetBy);
                    resetIds.push(evaluation.id);
                    this.logger.debug(`하향평가 초기화 완료: ${evaluation.id}`);
                }
                catch (error) {
                    failedItems.push({
                        evaluationId: evaluation.id,
                        error: error instanceof Error ? error.message : String(error),
                    });
                    this.logger.error(`하향평가 초기화 실패: ${evaluation.id}`, error instanceof Error ? error.stack : undefined);
                }
            }
            if (resetIds.length > 0) {
                this.logger.debug(`단계 승인 상태를 pending으로 변경 시작 - 피평가자: ${evaluateeId}, 평가기간: ${periodId}, 평가유형: ${evaluationType}`);
                const mapping = await this.mappingRepository.findOne({
                    where: {
                        evaluationPeriodId: periodId,
                        employeeId: evaluateeId,
                        deletedAt: null,
                    },
                });
                if (mapping) {
                    const stepApproval = await this.stepApprovalService.맵핑ID로_조회한다(mapping.id);
                    if (stepApproval) {
                        if (evaluationType === downward_evaluation_types_1.DownwardEvaluationType.PRIMARY) {
                            this.stepApprovalService.단계_상태를_변경한다(stepApproval, 'primary', employee_evaluation_step_approval_types_1.StepApprovalStatus.PENDING, resetBy);
                        }
                        else if (evaluationType === downward_evaluation_types_1.DownwardEvaluationType.SECONDARY) {
                            this.stepApprovalService.단계_상태를_변경한다(stepApproval, 'secondary', employee_evaluation_step_approval_types_1.StepApprovalStatus.PENDING, resetBy);
                        }
                        await this.stepApprovalService.저장한다(stepApproval);
                        this.logger.debug(`단계 승인 상태를 pending으로 변경 완료 - 피평가자: ${evaluateeId}, 평가유형: ${evaluationType}`);
                    }
                }
            }
            const result = {
                resetCount: resetIds.length,
                skippedCount: skippedIds.length,
                failedCount: failedItems.length,
                resetIds,
                skippedIds,
                failedItems,
            };
            this.logger.log('피평가자의 모든 하향평가 일괄 초기화 완료', {
                totalCount: evaluations.length,
                ...result,
            });
            return result;
        });
    }
};
exports.BulkResetDownwardEvaluationsHandler = BulkResetDownwardEvaluationsHandler;
exports.BulkResetDownwardEvaluationsHandler = BulkResetDownwardEvaluationsHandler = BulkResetDownwardEvaluationsHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(BulkResetDownwardEvaluationsCommand),
    __param(0, (0, typeorm_1.InjectRepository)(downward_evaluation_entity_1.DownwardEvaluation)),
    __param(1, (0, typeorm_1.InjectRepository)(evaluation_period_employee_mapping_entity_1.EvaluationPeriodEmployeeMapping)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        downward_evaluation_service_1.DownwardEvaluationService,
        transaction_manager_service_1.TransactionManagerService,
        employee_evaluation_step_approval_service_1.EmployeeEvaluationStepApprovalService])
], BulkResetDownwardEvaluationsHandler);
//# sourceMappingURL=bulk-reset-downward-evaluations.handler.js.map