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
var StepApprovalContextService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StepApprovalContextService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const employee_evaluation_step_approval_1 = require("../../domain/sub/employee-evaluation-step-approval");
const evaluation_revision_request_1 = require("../../domain/sub/evaluation-revision-request");
const evaluation_period_employee_mapping_entity_1 = require("../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity");
const evaluation_line_mapping_entity_1 = require("../../domain/core/evaluation-line-mapping/evaluation-line-mapping.entity");
let StepApprovalContextService = StepApprovalContextService_1 = class StepApprovalContextService {
    stepApprovalService;
    revisionRequestService;
    mappingRepository;
    evaluationLineMappingRepository;
    logger = new common_1.Logger(StepApprovalContextService_1.name);
    constructor(stepApprovalService, revisionRequestService, mappingRepository, evaluationLineMappingRepository) {
        this.stepApprovalService = stepApprovalService;
        this.revisionRequestService = revisionRequestService;
        this.mappingRepository = mappingRepository;
        this.evaluationLineMappingRepository = evaluationLineMappingRepository;
    }
    async 단계별_확인상태를_변경한다(request) {
        this.logger.log(`단계별 확인 상태 변경 시작 - 평가기간: ${request.evaluationPeriodId}, 직원: ${request.employeeId}, 단계: ${request.step}, 상태: ${request.status}`);
        const mapping = await this.mappingRepository.findOne({
            where: {
                evaluationPeriodId: request.evaluationPeriodId,
                employeeId: request.employeeId,
                deletedAt: null,
            },
        });
        if (!mapping) {
            throw new common_1.NotFoundException(`평가기간-직원 맵핑을 찾을 수 없습니다. (평가기간 ID: ${request.evaluationPeriodId}, 직원 ID: ${request.employeeId})`);
        }
        let stepApproval = await this.stepApprovalService.맵핑ID로_조회한다(mapping.id);
        if (!stepApproval) {
            this.logger.log(`단계 승인 정보가 없어 새로 생성합니다. - 맵핑 ID: ${mapping.id}`);
            stepApproval = await this.stepApprovalService.생성한다({
                evaluationPeriodEmployeeMappingId: mapping.id,
                createdBy: request.updatedBy,
            });
        }
        this.stepApprovalService.단계_상태를_변경한다(stepApproval, request.step, request.status, request.updatedBy);
        await this.stepApprovalService.저장한다(stepApproval);
        if (request.status === employee_evaluation_step_approval_1.StepApprovalStatus.REVISION_REQUESTED) {
            if (!request.revisionComment || request.revisionComment.trim() === '') {
                throw new common_1.NotFoundException('재작성 요청 코멘트는 필수입니다.');
            }
            await this.재작성요청을_생성한다(request.evaluationPeriodId, request.employeeId, request.step, request.revisionComment, request.updatedBy);
        }
        this.logger.log(`단계별 확인 상태 변경 완료 - 직원: ${request.employeeId}, 단계: ${request.step}`);
    }
    async 재작성요청을_생성한다(evaluationPeriodId, employeeId, step, comment, requestedBy) {
        this.logger.log(`재작성 요청 생성 시작 - 직원: ${employeeId}, 단계: ${step}`);
        const recipients = await this.재작성요청_수신자를_조회한다(evaluationPeriodId, employeeId, step);
        if (recipients.length === 0) {
            throw new common_1.NotFoundException(`재작성 요청 수신자를 찾을 수 없습니다. 평가라인 설정을 확인해주세요. (직원 ID: ${employeeId}, 단계: ${step})`);
        }
        await this.revisionRequestService.생성한다({
            evaluationPeriodId,
            employeeId,
            step,
            comment,
            requestedBy,
            recipients,
            createdBy: requestedBy,
        });
        this.logger.log(`재작성 요청 생성 완료 - 직원: ${employeeId}, 단계: ${step}, 수신자 수: ${recipients.length}`);
    }
    async 재작성요청_수신자를_조회한다(evaluationPeriodId, employeeId, step) {
        const recipients = [];
        switch (step) {
            case 'criteria':
            case 'self':
                recipients.push({
                    recipientId: employeeId,
                    recipientType: evaluation_revision_request_1.RecipientType.EVALUATEE,
                });
                const primaryEvaluator = await this.일차평가자를_조회한다(evaluationPeriodId, employeeId);
                if (primaryEvaluator) {
                    recipients.push({
                        recipientId: primaryEvaluator,
                        recipientType: evaluation_revision_request_1.RecipientType.PRIMARY_EVALUATOR,
                    });
                }
                break;
            case 'primary':
                const primaryOnly = await this.일차평가자를_조회한다(evaluationPeriodId, employeeId);
                if (primaryOnly) {
                    recipients.push({
                        recipientId: primaryOnly,
                        recipientType: evaluation_revision_request_1.RecipientType.PRIMARY_EVALUATOR,
                    });
                }
                break;
            case 'secondary':
                const secondaryEvaluators = await this.이차평가자들을_조회한다(evaluationPeriodId, employeeId);
                secondaryEvaluators.forEach((evaluatorId) => {
                    recipients.push({
                        recipientId: evaluatorId,
                        recipientType: evaluation_revision_request_1.RecipientType.SECONDARY_EVALUATOR,
                    });
                });
                break;
        }
        return recipients;
    }
    async 일차평가자를_조회한다(evaluationPeriodId, employeeId) {
        const mapping = await this.mappingRepository.findOne({
            where: {
                evaluationPeriodId,
                employeeId,
                deletedAt: null,
            },
        });
        if (!mapping) {
            return null;
        }
        const lineMapping = await this.evaluationLineMappingRepository
            .createQueryBuilder('mapping')
            .leftJoin('evaluation_lines', 'line', 'line.id = mapping.evaluationLineId')
            .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
            evaluationPeriodId,
        })
            .andWhere('mapping.employeeId = :employeeId', { employeeId })
            .andWhere('mapping.deletedAt IS NULL')
            .andWhere('line.evaluatorType = :evaluatorType', {
            evaluatorType: 'primary',
        })
            .andWhere('line.deletedAt IS NULL')
            .select('mapping.evaluatorId', 'evaluatorId')
            .getRawOne();
        return lineMapping?.evaluatorId || null;
    }
    async 이차평가자들을_조회한다(evaluationPeriodId, employeeId) {
        const mapping = await this.mappingRepository.findOne({
            where: {
                evaluationPeriodId,
                employeeId,
                deletedAt: null,
            },
        });
        if (!mapping) {
            return [];
        }
        const lineMappings = await this.evaluationLineMappingRepository
            .createQueryBuilder('mapping')
            .leftJoin('evaluation_lines', 'line', 'line.id = mapping.evaluationLineId')
            .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
            evaluationPeriodId,
        })
            .andWhere('mapping.employeeId = :employeeId', { employeeId })
            .andWhere('mapping.deletedAt IS NULL')
            .andWhere('line.evaluatorType = :evaluatorType', {
            evaluatorType: 'secondary',
        })
            .andWhere('line.deletedAt IS NULL')
            .select('mapping.evaluatorId', 'evaluatorId')
            .getRawMany();
        return lineMappings.map((mapping) => mapping.evaluatorId);
    }
    async 평가기준설정_확인상태를_변경한다(request) {
        await this.단계별_확인상태를_변경한다({
            evaluationPeriodId: request.evaluationPeriodId,
            employeeId: request.employeeId,
            step: 'criteria',
            status: request.status,
            revisionComment: request.revisionComment,
            updatedBy: request.updatedBy,
        });
    }
    async 자기평가_확인상태를_변경한다(request) {
        await this.단계별_확인상태를_변경한다({
            evaluationPeriodId: request.evaluationPeriodId,
            employeeId: request.employeeId,
            step: 'self',
            status: request.status,
            revisionComment: request.revisionComment,
            updatedBy: request.updatedBy,
        });
    }
    async 일차하향평가_확인상태를_변경한다(request) {
        await this.단계별_확인상태를_변경한다({
            evaluationPeriodId: request.evaluationPeriodId,
            employeeId: request.employeeId,
            step: 'primary',
            status: request.status,
            revisionComment: request.revisionComment,
            updatedBy: request.updatedBy,
        });
    }
    async 이차하향평가_확인상태를_변경한다(request) {
        this.logger.log(`2차 하향평가 확인 상태 변경 시작 - 평가기간: ${request.evaluationPeriodId}, 직원: ${request.employeeId}, 평가자: ${request.evaluatorId}, 상태: ${request.status}`);
        const mapping = await this.mappingRepository.findOne({
            where: {
                evaluationPeriodId: request.evaluationPeriodId,
                employeeId: request.employeeId,
                deletedAt: null,
            },
        });
        if (!mapping) {
            throw new common_1.NotFoundException(`평가기간-직원 맵핑을 찾을 수 없습니다. (평가기간 ID: ${request.evaluationPeriodId}, 직원 ID: ${request.employeeId})`);
        }
        const isSecondaryEvaluator = await this.평가자가_2차평가자인지_확인한다(request.evaluationPeriodId, request.employeeId, request.evaluatorId);
        if (!isSecondaryEvaluator) {
            throw new common_1.NotFoundException(`해당 평가자는 2차 평가자가 아닙니다. (평가기간 ID: ${request.evaluationPeriodId}, 직원 ID: ${request.employeeId}, 평가자 ID: ${request.evaluatorId})`);
        }
        let stepApproval = await this.stepApprovalService.맵핑ID로_조회한다(mapping.id);
        if (!stepApproval) {
            this.logger.log(`단계 승인 정보가 없어 새로 생성합니다. - 맵핑 ID: ${mapping.id}`);
            stepApproval = await this.stepApprovalService.생성한다({
                evaluationPeriodEmployeeMappingId: mapping.id,
                createdBy: request.updatedBy,
            });
        }
        this.stepApprovalService.단계_상태를_변경한다(stepApproval, 'secondary', request.status, request.updatedBy);
        await this.stepApprovalService.저장한다(stepApproval);
        if (request.status === employee_evaluation_step_approval_1.StepApprovalStatus.REVISION_REQUESTED) {
            if (!request.revisionComment || request.revisionComment.trim() === '') {
                throw new common_1.NotFoundException('재작성 요청 코멘트는 필수입니다.');
            }
            await this.재작성요청을_평가자별로_생성한다(request.evaluationPeriodId, request.employeeId, request.evaluatorId, request.revisionComment, request.updatedBy);
        }
        this.logger.log(`2차 하향평가 확인 상태 변경 완료 - 직원: ${request.employeeId}, 평가자: ${request.evaluatorId}`);
    }
    async 평가자가_2차평가자인지_확인한다(evaluationPeriodId, employeeId, evaluatorId) {
        const lineMapping = await this.evaluationLineMappingRepository
            .createQueryBuilder('mapping')
            .leftJoin('evaluation_lines', 'line', 'line.id = mapping.evaluationLineId')
            .where('mapping.evaluationPeriodId = :evaluationPeriodId', {
            evaluationPeriodId,
        })
            .andWhere('mapping.employeeId = :employeeId', { employeeId })
            .andWhere('mapping.evaluatorId = :evaluatorId', { evaluatorId })
            .andWhere('mapping.deletedAt IS NULL')
            .andWhere('line.evaluatorType = :evaluatorType', {
            evaluatorType: 'secondary',
        })
            .andWhere('line.deletedAt IS NULL')
            .getOne();
        return !!lineMapping;
    }
    async 재작성요청을_평가자별로_생성한다(evaluationPeriodId, employeeId, evaluatorId, comment, requestedBy) {
        this.logger.log(`재작성 요청 생성 시작 (평가자별) - 직원: ${employeeId}, 평가자: ${evaluatorId}`);
        const recipients = [
            {
                recipientId: evaluatorId,
                recipientType: evaluation_revision_request_1.RecipientType.SECONDARY_EVALUATOR,
            },
        ];
        await this.revisionRequestService.생성한다({
            evaluationPeriodId,
            employeeId,
            step: 'secondary',
            comment,
            requestedBy,
            recipients,
            createdBy: requestedBy,
        });
        this.logger.log(`재작성 요청 생성 완료 (평가자별) - 직원: ${employeeId}, 평가자: ${evaluatorId}`);
    }
};
exports.StepApprovalContextService = StepApprovalContextService;
exports.StepApprovalContextService = StepApprovalContextService = StepApprovalContextService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, typeorm_1.InjectRepository)(evaluation_period_employee_mapping_entity_1.EvaluationPeriodEmployeeMapping)),
    __param(3, (0, typeorm_1.InjectRepository)(evaluation_line_mapping_entity_1.EvaluationLineMapping)),
    __metadata("design:paramtypes", [employee_evaluation_step_approval_1.EmployeeEvaluationStepApprovalService,
        evaluation_revision_request_1.EvaluationRevisionRequestService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], StepApprovalContextService);
//# sourceMappingURL=step-approval-context.service.js.map