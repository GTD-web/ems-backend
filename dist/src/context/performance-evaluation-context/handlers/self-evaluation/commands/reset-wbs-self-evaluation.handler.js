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
var ResetWbsSelfEvaluationHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResetWbsSelfEvaluationHandler = exports.ResetWbsSelfEvaluationCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const wbs_self_evaluation_service_1 = require("../../../../../domain/core/wbs-self-evaluation/wbs-self-evaluation.service");
const transaction_manager_service_1 = require("../../../../../../libs/database/transaction-manager.service");
const evaluation_period_employee_mapping_entity_1 = require("../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity");
const employee_evaluation_step_approval_service_1 = require("../../../../../domain/sub/employee-evaluation-step-approval/employee-evaluation-step-approval.service");
const employee_evaluation_step_approval_types_1 = require("../../../../../domain/sub/employee-evaluation-step-approval/employee-evaluation-step-approval.types");
class ResetWbsSelfEvaluationCommand {
    evaluationId;
    resetBy;
    constructor(evaluationId, resetBy = '시스템') {
        this.evaluationId = evaluationId;
        this.resetBy = resetBy;
    }
}
exports.ResetWbsSelfEvaluationCommand = ResetWbsSelfEvaluationCommand;
let ResetWbsSelfEvaluationHandler = ResetWbsSelfEvaluationHandler_1 = class ResetWbsSelfEvaluationHandler {
    wbsSelfEvaluationService;
    transactionManager;
    mappingRepository;
    stepApprovalService;
    logger = new common_1.Logger(ResetWbsSelfEvaluationHandler_1.name);
    constructor(wbsSelfEvaluationService, transactionManager, mappingRepository, stepApprovalService) {
        this.wbsSelfEvaluationService = wbsSelfEvaluationService;
        this.transactionManager = transactionManager;
        this.mappingRepository = mappingRepository;
        this.stepApprovalService = stepApprovalService;
    }
    async execute(command) {
        const { evaluationId, resetBy } = command;
        this.logger.log('WBS 자기평가 초기화 시작', { evaluationId });
        return await this.transactionManager.executeTransaction(async () => {
            const evaluation = await this.wbsSelfEvaluationService.조회한다(evaluationId);
            if (!evaluation) {
                throw new common_1.BadRequestException('존재하지 않는 자기평가입니다.');
            }
            if (!evaluation.일차평가자가_관리자에게_제출했는가()) {
                throw new common_1.BadRequestException('이미 관리자에게 미제출 상태인 자기평가입니다.');
            }
            const updatedEvaluation = await this.wbsSelfEvaluationService.수정한다(evaluationId, { submittedToManager: false }, resetBy);
            this.logger.debug('승인 상태 초기화 시작');
            const mapping = await this.mappingRepository.findOne({
                where: {
                    evaluationPeriodId: evaluation.periodId,
                    employeeId: evaluation.employeeId,
                    deletedAt: (0, typeorm_2.IsNull)(),
                },
            });
            if (mapping) {
                this.logger.debug('Mapping 조회 성공', {
                    mappingId: mapping.id,
                });
                const stepApproval = await this.stepApprovalService.맵핑ID로_조회한다(mapping.id);
                if (stepApproval) {
                    this.logger.debug('승인 레코드 조회 성공', {
                        approvalId: stepApproval.id,
                        currentStatus: stepApproval.selfEvaluationStatus,
                    });
                    if (stepApproval.selfEvaluationStatus === employee_evaluation_step_approval_types_1.StepApprovalStatus.APPROVED) {
                        this.stepApprovalService.단계_상태를_변경한다(stepApproval, 'self', employee_evaluation_step_approval_types_1.StepApprovalStatus.PENDING, resetBy);
                        await this.stepApprovalService.저장한다(stepApproval);
                        this.logger.debug('승인 상태 변경 완료', {
                            approvalId: stepApproval.id,
                            oldStatus: employee_evaluation_step_approval_types_1.StepApprovalStatus.APPROVED,
                            newStatus: employee_evaluation_step_approval_types_1.StepApprovalStatus.PENDING,
                        });
                    }
                    else {
                        this.logger.debug(`승인 상태가 approved가 아니므로 스킵 (현재: ${stepApproval.selfEvaluationStatus})`);
                    }
                }
                else {
                    this.logger.debug('승인 레코드를 찾을 수 없음');
                }
            }
            else {
                this.logger.debug('Mapping을 찾을 수 없음');
            }
            this.logger.log('WBS 자기평가 초기화 완료', { evaluationId });
            return updatedEvaluation.DTO로_변환한다();
        });
    }
};
exports.ResetWbsSelfEvaluationHandler = ResetWbsSelfEvaluationHandler;
exports.ResetWbsSelfEvaluationHandler = ResetWbsSelfEvaluationHandler = ResetWbsSelfEvaluationHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(ResetWbsSelfEvaluationCommand),
    __param(2, (0, typeorm_1.InjectRepository)(evaluation_period_employee_mapping_entity_1.EvaluationPeriodEmployeeMapping)),
    __metadata("design:paramtypes", [wbs_self_evaluation_service_1.WbsSelfEvaluationService,
        transaction_manager_service_1.TransactionManagerService,
        typeorm_2.Repository,
        employee_evaluation_step_approval_service_1.EmployeeEvaluationStepApprovalService])
], ResetWbsSelfEvaluationHandler);
//# sourceMappingURL=reset-wbs-self-evaluation.handler.js.map