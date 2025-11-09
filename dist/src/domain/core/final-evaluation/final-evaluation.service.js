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
var FinalEvaluationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinalEvaluationService = void 0;
const transaction_manager_service_1 = require("../../../../libs/database/transaction-manager.service");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const final_evaluation_validation_service_1 = require("./final-evaluation-validation.service");
const final_evaluation_entity_1 = require("./final-evaluation.entity");
const final_evaluation_exceptions_1 = require("./final-evaluation.exceptions");
let FinalEvaluationService = FinalEvaluationService_1 = class FinalEvaluationService {
    finalEvaluationRepository;
    transactionManager;
    validationService;
    logger = new common_1.Logger(FinalEvaluationService_1.name);
    constructor(finalEvaluationRepository, transactionManager, validationService) {
        this.finalEvaluationRepository = finalEvaluationRepository;
        this.transactionManager = transactionManager;
        this.validationService = validationService;
    }
    async executeSafeDomainOperation(operation, context) {
        return this.transactionManager.executeSafeOperation(operation, context);
    }
    async 생성한다(createData, manager) {
        return this.executeSafeDomainOperation(async () => {
            this.logger.debug('최종평가 생성 시작');
            await this.validationService.생성데이터검증한다(createData, manager);
            const repository = this.transactionManager.getRepository(final_evaluation_entity_1.FinalEvaluation, this.finalEvaluationRepository, manager);
            const finalEvaluation = repository.create({
                employeeId: createData.employeeId,
                periodId: createData.periodId,
                evaluationGrade: createData.evaluationGrade,
                jobGrade: createData.jobGrade,
                jobDetailedGrade: createData.jobDetailedGrade,
                finalComments: createData.finalComments,
                isConfirmed: false,
            });
            finalEvaluation.생성자를_설정한다(createData.createdBy);
            const savedFinalEvaluation = await repository.save(finalEvaluation);
            this.logger.log(`최종평가 생성 완료 - ID: ${savedFinalEvaluation.id}, 직원: ${createData.employeeId}, 평가기간: ${createData.periodId}`);
            return savedFinalEvaluation;
        }, '생성한다');
    }
    async 수정한다(id, updateData, updatedBy, manager) {
        return this.executeSafeDomainOperation(async () => {
            this.logger.debug(`최종평가 수정 시작 - ID: ${id}`);
            await this.validationService.업데이트데이터검증한다(id, updateData, manager);
            const repository = this.transactionManager.getRepository(final_evaluation_entity_1.FinalEvaluation, this.finalEvaluationRepository, manager);
            const finalEvaluation = await repository.findOne({ where: { id } });
            if (!finalEvaluation) {
                throw new final_evaluation_exceptions_1.FinalEvaluationNotFoundException(id);
            }
            if (updateData.evaluationGrade !== undefined) {
                finalEvaluation.평가등급을_변경한다(updateData.evaluationGrade, updatedBy);
            }
            if (updateData.jobGrade !== undefined) {
                finalEvaluation.직무등급을_변경한다(updateData.jobGrade, updatedBy);
            }
            if (updateData.jobDetailedGrade !== undefined) {
                finalEvaluation.직무_상세등급을_변경한다(updateData.jobDetailedGrade, updatedBy);
            }
            if (updateData.finalComments !== undefined) {
                finalEvaluation.최종_평가_의견을_변경한다(updateData.finalComments, updatedBy);
            }
            const updatedFinalEvaluation = await repository.save(finalEvaluation);
            this.logger.log(`최종평가 수정 완료 - ID: ${id}, 수정자: ${updatedBy}`);
            return updatedFinalEvaluation;
        }, '수정한다');
    }
    async 삭제한다(id, deletedBy, manager) {
        return this.executeSafeDomainOperation(async () => {
            this.logger.debug(`최종평가 삭제 시작 - ID: ${id}`);
            const repository = this.transactionManager.getRepository(final_evaluation_entity_1.FinalEvaluation, this.finalEvaluationRepository, manager);
            const finalEvaluation = await repository.findOne({ where: { id } });
            if (!finalEvaluation) {
                throw new final_evaluation_exceptions_1.FinalEvaluationNotFoundException(id);
            }
            if (finalEvaluation.isConfirmed) {
                throw new final_evaluation_exceptions_1.AlreadyConfirmedEvaluationException(id);
            }
            finalEvaluation.deletedAt = new Date();
            finalEvaluation.수정자를_설정한다(deletedBy);
            await repository.save(finalEvaluation);
            this.logger.log(`최종평가 삭제 완료 - ID: ${id}, 삭제자: ${deletedBy}`);
        }, '삭제한다');
    }
    async 확정한다(id, confirmedBy, manager) {
        return this.executeSafeDomainOperation(async () => {
            this.logger.debug(`최종평가 확정 시작 - ID: ${id}`);
            const repository = this.transactionManager.getRepository(final_evaluation_entity_1.FinalEvaluation, this.finalEvaluationRepository, manager);
            const finalEvaluation = await repository.findOne({ where: { id } });
            if (!finalEvaluation) {
                throw new final_evaluation_exceptions_1.FinalEvaluationNotFoundException(id);
            }
            finalEvaluation.평가를_확정한다(confirmedBy);
            const confirmedFinalEvaluation = await repository.save(finalEvaluation);
            this.logger.log(`최종평가 확정 완료 - ID: ${id}, 확정자: ${confirmedBy}`);
            return confirmedFinalEvaluation;
        }, '확정한다');
    }
    async 확정_취소한다(id, updatedBy, manager) {
        return this.executeSafeDomainOperation(async () => {
            this.logger.debug(`최종평가 확정 취소 시작 - ID: ${id}`);
            const repository = this.transactionManager.getRepository(final_evaluation_entity_1.FinalEvaluation, this.finalEvaluationRepository, manager);
            const finalEvaluation = await repository.findOne({ where: { id } });
            if (!finalEvaluation) {
                throw new final_evaluation_exceptions_1.FinalEvaluationNotFoundException(id);
            }
            finalEvaluation.평가_확정을_취소한다(updatedBy);
            const updatedFinalEvaluation = await repository.save(finalEvaluation);
            this.logger.log(`최종평가 확정 취소 완료 - ID: ${id}, 수정자: ${updatedBy}`);
            return updatedFinalEvaluation;
        }, '확정_취소한다');
    }
    async 평가등급_변경한다(id, evaluationGrade, updatedBy, manager) {
        return this.executeSafeDomainOperation(async () => {
            this.logger.debug(`평가등급 변경 시작 - ID: ${id}`);
            const repository = this.transactionManager.getRepository(final_evaluation_entity_1.FinalEvaluation, this.finalEvaluationRepository, manager);
            const finalEvaluation = await repository.findOne({ where: { id } });
            if (!finalEvaluation) {
                throw new final_evaluation_exceptions_1.FinalEvaluationNotFoundException(id);
            }
            finalEvaluation.평가등급을_변경한다(evaluationGrade, updatedBy);
            const updatedFinalEvaluation = await repository.save(finalEvaluation);
            this.logger.log(`평가등급 변경 완료 - ID: ${id}, 새 등급: ${evaluationGrade}, 수정자: ${updatedBy}`);
            return updatedFinalEvaluation;
        }, '평가등급_변경한다');
    }
    async 직무등급_변경한다(id, jobGrade, updatedBy, manager) {
        return this.executeSafeDomainOperation(async () => {
            this.logger.debug(`직무등급 변경 시작 - ID: ${id}`);
            const repository = this.transactionManager.getRepository(final_evaluation_entity_1.FinalEvaluation, this.finalEvaluationRepository, manager);
            const finalEvaluation = await repository.findOne({ where: { id } });
            if (!finalEvaluation) {
                throw new final_evaluation_exceptions_1.FinalEvaluationNotFoundException(id);
            }
            const jobGradeEnum = jobGrade;
            finalEvaluation.직무등급을_변경한다(jobGradeEnum, updatedBy);
            const updatedFinalEvaluation = await repository.save(finalEvaluation);
            this.logger.log(`직무등급 변경 완료 - ID: ${id}, 새 등급: ${jobGrade}, 수정자: ${updatedBy}`);
            return updatedFinalEvaluation;
        }, '직무등급_변경한다');
    }
    async 직무_상세등급_변경한다(id, jobDetailedGrade, updatedBy, manager) {
        return this.executeSafeDomainOperation(async () => {
            this.logger.debug(`직무 상세등급 변경 시작 - ID: ${id}`);
            const repository = this.transactionManager.getRepository(final_evaluation_entity_1.FinalEvaluation, this.finalEvaluationRepository, manager);
            const finalEvaluation = await repository.findOne({ where: { id } });
            if (!finalEvaluation) {
                throw new final_evaluation_exceptions_1.FinalEvaluationNotFoundException(id);
            }
            const jobDetailedGradeEnum = jobDetailedGrade;
            finalEvaluation.직무_상세등급을_변경한다(jobDetailedGradeEnum, updatedBy);
            const updatedFinalEvaluation = await repository.save(finalEvaluation);
            this.logger.log(`직무 상세등급 변경 완료 - ID: ${id}, 새 등급: ${jobDetailedGrade}, 수정자: ${updatedBy}`);
            return updatedFinalEvaluation;
        }, '직무_상세등급_변경한다');
    }
};
exports.FinalEvaluationService = FinalEvaluationService;
exports.FinalEvaluationService = FinalEvaluationService = FinalEvaluationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(final_evaluation_entity_1.FinalEvaluation)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        transaction_manager_service_1.TransactionManagerService,
        final_evaluation_validation_service_1.FinalEvaluationValidationService])
], FinalEvaluationService);
//# sourceMappingURL=final-evaluation.service.js.map