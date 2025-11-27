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
var ResetAllWbsSelfEvaluationsByEmployeePeriodHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResetAllWbsSelfEvaluationsByEmployeePeriodHandler = exports.ResetAllWbsSelfEvaluationsByEmployeePeriodCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const wbs_self_evaluation_service_1 = require("../../../../../domain/core/wbs-self-evaluation/wbs-self-evaluation.service");
const transaction_manager_service_1 = require("../../../../../../libs/database/transaction-manager.service");
const evaluation_period_employee_mapping_entity_1 = require("../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity");
const employee_evaluation_step_approval_service_1 = require("../../../../../domain/sub/employee-evaluation-step-approval/employee-evaluation-step-approval.service");
const employee_evaluation_step_approval_types_1 = require("../../../../../domain/sub/employee-evaluation-step-approval/employee-evaluation-step-approval.types");
class ResetAllWbsSelfEvaluationsByEmployeePeriodCommand {
    employeeId;
    periodId;
    resetBy;
    constructor(employeeId, periodId, resetBy = '시스템') {
        this.employeeId = employeeId;
        this.periodId = periodId;
        this.resetBy = resetBy;
    }
}
exports.ResetAllWbsSelfEvaluationsByEmployeePeriodCommand = ResetAllWbsSelfEvaluationsByEmployeePeriodCommand;
let ResetAllWbsSelfEvaluationsByEmployeePeriodHandler = ResetAllWbsSelfEvaluationsByEmployeePeriodHandler_1 = class ResetAllWbsSelfEvaluationsByEmployeePeriodHandler {
    wbsSelfEvaluationService;
    transactionManager;
    mappingRepository;
    stepApprovalService;
    logger = new common_1.Logger(ResetAllWbsSelfEvaluationsByEmployeePeriodHandler_1.name);
    constructor(wbsSelfEvaluationService, transactionManager, mappingRepository, stepApprovalService) {
        this.wbsSelfEvaluationService = wbsSelfEvaluationService;
        this.transactionManager = transactionManager;
        this.mappingRepository = mappingRepository;
        this.stepApprovalService = stepApprovalService;
    }
    async execute(command) {
        const { employeeId, periodId, resetBy } = command;
        this.logger.log('직원의 전체 WBS 자기평가 초기화 시작', {
            employeeId,
            periodId,
        });
        return await this.transactionManager.executeTransaction(async () => {
            const evaluations = await this.wbsSelfEvaluationService.필터_조회한다({
                employeeId,
                periodId,
            });
            if (evaluations.length === 0) {
                throw new common_1.BadRequestException('초기화할 자기평가가 존재하지 않습니다.');
            }
            const resetEvaluations = [];
            const failedResets = [];
            for (const evaluation of evaluations) {
                try {
                    const wasSubmittedToManager = evaluation.일차평가자가_관리자에게_제출했는가();
                    const wasSubmittedToEvaluator = evaluation.피평가자가_1차평가자에게_제출했는가();
                    if (!wasSubmittedToManager) {
                        this.logger.debug(`이미 관리자에게 미제출 상태 스킵 - ID: ${evaluation.id}`);
                        continue;
                    }
                    const updateData = {
                        submittedToManager: false,
                        resetSubmittedToManagerAt: true,
                    };
                    if (wasSubmittedToEvaluator) {
                        updateData.submittedToEvaluator = false;
                        updateData.resetSubmittedToEvaluatorAt = true;
                    }
                    await this.wbsSelfEvaluationService.수정한다(evaluation.id, updateData, resetBy);
                    resetEvaluations.push({
                        evaluationId: evaluation.id,
                        wbsItemId: evaluation.wbsItemId,
                        selfEvaluationContent: evaluation.selfEvaluationContent,
                        selfEvaluationScore: evaluation.selfEvaluationScore,
                        performanceResult: evaluation.performanceResult,
                        wasSubmittedToManager,
                    });
                    this.logger.debug(`평가 초기화 성공 - ID: ${evaluation.id}`);
                }
                catch (error) {
                    this.logger.error(`평가 초기화 실패 - ID: ${evaluation.id}`, error);
                    failedResets.push({
                        evaluationId: evaluation.id,
                        wbsItemId: evaluation.wbsItemId,
                        reason: error.message || '알 수 없는 오류가 발생했습니다.',
                    });
                }
            }
            if (resetEvaluations.length > 0) {
                this.logger.debug('승인 상태 초기화 시작');
                const mapping = await this.mappingRepository.findOne({
                    where: {
                        evaluationPeriodId: periodId,
                        employeeId: employeeId,
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
            }
            const result = {
                resetCount: resetEvaluations.length,
                failedCount: failedResets.length,
                totalCount: evaluations.length,
                resetEvaluations,
                failedResets,
            };
            this.logger.log('직원의 전체 WBS 자기평가 초기화 완료', {
                employeeId,
                periodId,
                resetCount: result.resetCount,
                failedCount: result.failedCount,
            });
            if (resetEvaluations.length === 0) {
                this.logger.warn('초기화된 평가 없음 (모두 미완료 상태)', {
                    totalCount: evaluations.length,
                });
            }
            if (failedResets.length > 0) {
                this.logger.warn('일부 평가 초기화 실패', {
                    failedCount: failedResets.length,
                    failures: failedResets,
                });
            }
            return result;
        });
    }
};
exports.ResetAllWbsSelfEvaluationsByEmployeePeriodHandler = ResetAllWbsSelfEvaluationsByEmployeePeriodHandler;
exports.ResetAllWbsSelfEvaluationsByEmployeePeriodHandler = ResetAllWbsSelfEvaluationsByEmployeePeriodHandler = ResetAllWbsSelfEvaluationsByEmployeePeriodHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(ResetAllWbsSelfEvaluationsByEmployeePeriodCommand),
    __param(2, (0, typeorm_1.InjectRepository)(evaluation_period_employee_mapping_entity_1.EvaluationPeriodEmployeeMapping)),
    __metadata("design:paramtypes", [wbs_self_evaluation_service_1.WbsSelfEvaluationService,
        transaction_manager_service_1.TransactionManagerService,
        typeorm_2.Repository,
        employee_evaluation_step_approval_service_1.EmployeeEvaluationStepApprovalService])
], ResetAllWbsSelfEvaluationsByEmployeePeriodHandler);
//# sourceMappingURL=reset-all-wbs-self-evaluations.handler.js.map