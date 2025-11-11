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
var FinalEvaluationValidationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinalEvaluationValidationService = void 0;
const transaction_manager_service_1 = require("../../../../libs/database/transaction-manager.service");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const final_evaluation_entity_1 = require("./final-evaluation.entity");
const final_evaluation_exceptions_1 = require("./final-evaluation.exceptions");
const final_evaluation_types_1 = require("./final-evaluation.types");
let FinalEvaluationValidationService = FinalEvaluationValidationService_1 = class FinalEvaluationValidationService {
    finalEvaluationRepository;
    transactionManager;
    logger = new common_1.Logger(FinalEvaluationValidationService_1.name);
    constructor(finalEvaluationRepository, transactionManager) {
        this.finalEvaluationRepository = finalEvaluationRepository;
        this.transactionManager = transactionManager;
    }
    async 생성데이터검증한다(createData, manager) {
        this.logger.debug('최종평가 생성 데이터 검증 시작');
        this.필수데이터검증한다(createData);
        this.데이터형식검증한다(createData);
        await this.비즈니스규칙검증한다(createData, manager);
        await this.중복검증한다(createData, manager);
        this.logger.debug('최종평가 생성 데이터 검증 완료');
    }
    async 업데이트데이터검증한다(id, updateData, manager) {
        this.logger.debug(`최종평가 업데이트 데이터 검증 시작 - ID: ${id}`);
        if (Object.keys(updateData).length === 0) {
            throw new final_evaluation_exceptions_1.FinalEvaluationRequiredDataMissingException('업데이트할 데이터가 없습니다.');
        }
        this.업데이트데이터형식검증한다(updateData);
        await this.확정된평가수정불가검증한다(id, manager);
        this.logger.debug(`최종평가 업데이트 데이터 검증 완료 - ID: ${id}`);
    }
    필수데이터검증한다(createData) {
        if (!createData.employeeId) {
            throw new final_evaluation_exceptions_1.FinalEvaluationRequiredDataMissingException('직원 ID는 필수입니다.');
        }
        if (!createData.periodId) {
            throw new final_evaluation_exceptions_1.FinalEvaluationRequiredDataMissingException('평가기간 ID는 필수입니다.');
        }
        if (!createData.evaluationGrade) {
            throw new final_evaluation_exceptions_1.FinalEvaluationRequiredDataMissingException('평가등급은 필수입니다.');
        }
        if (!createData.jobGrade) {
            throw new final_evaluation_exceptions_1.FinalEvaluationRequiredDataMissingException('직무등급은 필수입니다.');
        }
        if (!createData.jobDetailedGrade) {
            throw new final_evaluation_exceptions_1.FinalEvaluationRequiredDataMissingException('직무 상세등급은 필수입니다.');
        }
    }
    데이터형식검증한다(createData) {
        if (createData.evaluationGrade.trim().length === 0) {
            throw new final_evaluation_exceptions_1.InvalidEvaluationGradeException(createData.evaluationGrade);
        }
        if (!Object.values(final_evaluation_types_1.JobGrade).includes(createData.jobGrade)) {
            throw new final_evaluation_exceptions_1.InvalidJobGradeException(createData.jobGrade, Object.values(final_evaluation_types_1.JobGrade));
        }
        if (!Object.values(final_evaluation_types_1.JobDetailedGrade).includes(createData.jobDetailedGrade)) {
            throw new final_evaluation_exceptions_1.InvalidJobDetailedGradeException(createData.jobDetailedGrade, Object.values(final_evaluation_types_1.JobDetailedGrade));
        }
    }
    업데이트데이터형식검증한다(updateData) {
        if (updateData.evaluationGrade !== undefined &&
            updateData.evaluationGrade.trim().length === 0) {
            throw new final_evaluation_exceptions_1.InvalidEvaluationGradeException(updateData.evaluationGrade);
        }
        if (updateData.jobGrade !== undefined &&
            !Object.values(final_evaluation_types_1.JobGrade).includes(updateData.jobGrade)) {
            throw new final_evaluation_exceptions_1.InvalidJobGradeException(updateData.jobGrade, Object.values(final_evaluation_types_1.JobGrade));
        }
        if (updateData.jobDetailedGrade !== undefined &&
            !Object.values(final_evaluation_types_1.JobDetailedGrade).includes(updateData.jobDetailedGrade)) {
            throw new final_evaluation_exceptions_1.InvalidJobDetailedGradeException(updateData.jobDetailedGrade, Object.values(final_evaluation_types_1.JobDetailedGrade));
        }
    }
    async 비즈니스규칙검증한다(createData, manager) {
    }
    async 중복검증한다(createData, manager) {
        const repository = this.transactionManager.getRepository(final_evaluation_entity_1.FinalEvaluation, this.finalEvaluationRepository, manager);
        const existingEvaluation = await repository.findOne({
            where: {
                employeeId: createData.employeeId,
                periodId: createData.periodId,
            },
        });
        if (existingEvaluation) {
            throw new final_evaluation_exceptions_1.DuplicateFinalEvaluationException(createData.employeeId, createData.periodId);
        }
    }
    async 확정된평가수정불가검증한다(id, manager) {
        const repository = this.transactionManager.getRepository(final_evaluation_entity_1.FinalEvaluation, this.finalEvaluationRepository, manager);
        const evaluation = await repository.findOne({ where: { id } });
        if (evaluation?.isConfirmed) {
            throw new final_evaluation_exceptions_1.ConfirmedEvaluationModificationException(id);
        }
    }
    async 최종평가존재확인한다(id, manager) {
        const repository = this.transactionManager.getRepository(final_evaluation_entity_1.FinalEvaluation, this.finalEvaluationRepository, manager);
        const count = await repository.count({ where: { id } });
        return count > 0;
    }
    async 직원과평가기간으로존재확인한다(employeeId, periodId, manager) {
        const repository = this.transactionManager.getRepository(final_evaluation_entity_1.FinalEvaluation, this.finalEvaluationRepository, manager);
        const count = await repository.count({
            where: { employeeId, periodId },
        });
        return count > 0;
    }
};
exports.FinalEvaluationValidationService = FinalEvaluationValidationService;
exports.FinalEvaluationValidationService = FinalEvaluationValidationService = FinalEvaluationValidationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(final_evaluation_entity_1.FinalEvaluation)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        transaction_manager_service_1.TransactionManagerService])
], FinalEvaluationValidationService);
//# sourceMappingURL=final-evaluation-validation.service.js.map