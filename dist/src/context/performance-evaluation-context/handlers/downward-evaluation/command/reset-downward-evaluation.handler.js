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
var ResetDownwardEvaluationHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResetDownwardEvaluationHandler = exports.ResetDownwardEvaluationCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const downward_evaluation_service_1 = require("../../../../../domain/core/downward-evaluation/downward-evaluation.service");
const downward_evaluation_exceptions_1 = require("../../../../../domain/core/downward-evaluation/downward-evaluation.exceptions");
const transaction_manager_service_1 = require("../../../../../../libs/database/transaction-manager.service");
const evaluation_period_employee_mapping_entity_1 = require("../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity");
const employee_evaluation_step_approval_service_1 = require("../../../../../domain/sub/employee-evaluation-step-approval/employee-evaluation-step-approval.service");
class ResetDownwardEvaluationCommand {
    evaluationId;
    resetBy;
    constructor(evaluationId, resetBy = '시스템') {
        this.evaluationId = evaluationId;
        this.resetBy = resetBy;
    }
}
exports.ResetDownwardEvaluationCommand = ResetDownwardEvaluationCommand;
let ResetDownwardEvaluationHandler = ResetDownwardEvaluationHandler_1 = class ResetDownwardEvaluationHandler {
    downwardEvaluationService;
    transactionManager;
    mappingRepository;
    stepApprovalService;
    logger = new common_1.Logger(ResetDownwardEvaluationHandler_1.name);
    constructor(downwardEvaluationService, transactionManager, mappingRepository, stepApprovalService) {
        this.downwardEvaluationService = downwardEvaluationService;
        this.transactionManager = transactionManager;
        this.mappingRepository = mappingRepository;
        this.stepApprovalService = stepApprovalService;
    }
    async execute(command) {
        const { evaluationId, resetBy } = command;
        this.logger.log('하향평가 초기화 핸들러 실행', { evaluationId });
        try {
            await this.transactionManager.executeTransaction(async () => {
                this.logger.debug(`하향평가 조회 시작 - ID: ${evaluationId}`);
                const evaluation = await this.downwardEvaluationService.조회한다(evaluationId);
                if (!evaluation) {
                    this.logger.error(`하향평가를 찾을 수 없음 - ID: ${evaluationId}`);
                    throw new downward_evaluation_exceptions_1.DownwardEvaluationNotFoundException(evaluationId);
                }
                this.logger.debug(`하향평가 조회 성공 - ID: ${evaluationId}, isCompleted: ${evaluation.isCompleted}`);
                if (!evaluation.완료되었는가()) {
                    this.logger.error(`이미 미제출 상태인 하향평가 - ID: ${evaluationId}, isCompleted: ${evaluation.isCompleted}`);
                    throw new downward_evaluation_exceptions_1.DownwardEvaluationNotCompletedException(evaluationId);
                }
                this.logger.debug(`하향평가 미제출 상태로 변경 시작 - ID: ${evaluationId}`);
                await this.downwardEvaluationService.수정한다(evaluationId, { isCompleted: false }, resetBy);
                this.logger.debug(`단계 승인 상태를 pending으로 변경 시작 - 피평가자: ${evaluation.employeeId}, 평가기간: ${evaluation.periodId}, 평가유형: ${evaluation.evaluationType}`);
                this.logger.debug(`승인 상태는 유지됨 - 피평가자: ${evaluation.employeeId}, 평가유형: ${evaluation.evaluationType}`);
                this.logger.log('하향평가 초기화 완료', {
                    evaluationId,
                    resetBy,
                    previousState: 'completed',
                    newState: 'not_completed',
                });
            });
        }
        catch (error) {
            this.logger.error(`하향평가 초기화 실패 - ID: ${evaluationId}`, error.stack, {
                evaluationId,
                resetBy,
                errorName: error.name,
                errorMessage: error.message,
            });
            throw error;
        }
    }
};
exports.ResetDownwardEvaluationHandler = ResetDownwardEvaluationHandler;
exports.ResetDownwardEvaluationHandler = ResetDownwardEvaluationHandler = ResetDownwardEvaluationHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(ResetDownwardEvaluationCommand),
    __param(2, (0, typeorm_1.InjectRepository)(evaluation_period_employee_mapping_entity_1.EvaluationPeriodEmployeeMapping)),
    __metadata("design:paramtypes", [downward_evaluation_service_1.DownwardEvaluationService,
        transaction_manager_service_1.TransactionManagerService,
        typeorm_2.Repository,
        employee_evaluation_step_approval_service_1.EmployeeEvaluationStepApprovalService])
], ResetDownwardEvaluationHandler);
//# sourceMappingURL=reset-downward-evaluation.handler.js.map