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
var WbsEvaluationCriteriaValidationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WbsEvaluationCriteriaValidationService = void 0;
const transaction_manager_service_1 = require("../../../../libs/database/transaction-manager.service");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const wbs_evaluation_criteria_entity_1 = require("./wbs-evaluation-criteria.entity");
const wbs_evaluation_criteria_exceptions_1 = require("./wbs-evaluation-criteria.exceptions");
let WbsEvaluationCriteriaValidationService = WbsEvaluationCriteriaValidationService_1 = class WbsEvaluationCriteriaValidationService {
    wbsEvaluationCriteriaRepository;
    transactionManager;
    logger = new common_1.Logger(WbsEvaluationCriteriaValidationService_1.name);
    constructor(wbsEvaluationCriteriaRepository, transactionManager) {
        this.wbsEvaluationCriteriaRepository = wbsEvaluationCriteriaRepository;
        this.transactionManager = transactionManager;
    }
    async 생성데이터검증한다(createData, manager) {
        this.logger.debug('WBS 평가 기준 생성 데이터 검증 시작');
        this.필수데이터검증한다(createData);
        this.데이터형식검증한다(createData);
        await this.비즈니스규칙검증한다(createData, manager);
        await this.중복검증한다(createData, manager);
        this.logger.debug('WBS 평가 기준 생성 데이터 검증 완료');
    }
    async 업데이트데이터검증한다(id, updateData, manager) {
        this.logger.debug(`WBS 평가 기준 업데이트 데이터 검증 시작 - ID: ${id}`);
        if (Object.keys(updateData).length === 0) {
            throw new wbs_evaluation_criteria_exceptions_1.WbsEvaluationCriteriaRequiredDataMissingException('업데이트할 데이터가 없습니다.');
        }
        this.업데이트데이터형식검증한다(updateData);
        if (updateData.criteria !== undefined) {
            await this.업데이트중복검증한다(id, updateData, manager);
        }
        this.logger.debug(`WBS 평가 기준 업데이트 데이터 검증 완료 - ID: ${id}`);
    }
    필수데이터검증한다(createData) {
        if (!createData.wbsItemId) {
            throw new wbs_evaluation_criteria_exceptions_1.WbsEvaluationCriteriaRequiredDataMissingException('WBS 항목 ID는 필수입니다.');
        }
        if (createData.criteria === undefined || createData.criteria === null) {
            throw new wbs_evaluation_criteria_exceptions_1.WbsEvaluationCriteriaRequiredDataMissingException('평가 기준 내용은 필수입니다.');
        }
    }
    데이터형식검증한다(createData) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(createData.wbsItemId)) {
            throw new wbs_evaluation_criteria_exceptions_1.InvalidWbsEvaluationCriteriaDataFormatException('WBS 항목 ID는 유효한 UUID 형식이어야 합니다.');
        }
        if (createData.criteria && createData.criteria.length > 1000) {
            throw new wbs_evaluation_criteria_exceptions_1.InvalidWbsEvaluationCriteriaDataFormatException('평가 기준 내용은 1000자를 초과할 수 없습니다.');
        }
    }
    업데이트데이터형식검증한다(updateData) {
        if (updateData.criteria !== undefined) {
            if (updateData.criteria.length > 1000) {
                throw new wbs_evaluation_criteria_exceptions_1.InvalidWbsEvaluationCriteriaDataFormatException('평가 기준 내용은 1000자를 초과할 수 없습니다.');
            }
        }
    }
    async 비즈니스규칙검증한다(createData, manager) {
    }
    async 중복검증한다(createData, manager) {
        const repository = this.transactionManager.getRepository(wbs_evaluation_criteria_entity_1.WbsEvaluationCriteria, this.wbsEvaluationCriteriaRepository, manager);
        const existingCriteria = await repository
            .createQueryBuilder('criteria')
            .where('criteria.wbsItemId = :wbsItemId', {
            wbsItemId: createData.wbsItemId,
        })
            .andWhere('TRIM(criteria.criteria) = :criteria', {
            criteria: createData.criteria.trim(),
        })
            .getOne();
        if (existingCriteria) {
            throw new wbs_evaluation_criteria_exceptions_1.WbsEvaluationCriteriaDuplicateException(createData.wbsItemId, createData.criteria);
        }
    }
    async 업데이트중복검증한다(id, updateData, manager) {
        const repository = this.transactionManager.getRepository(wbs_evaluation_criteria_entity_1.WbsEvaluationCriteria, this.wbsEvaluationCriteriaRepository, manager);
        const currentEntity = await repository.findOne({ where: { id } });
        if (!currentEntity) {
            return;
        }
        const existingCriteria = await repository
            .createQueryBuilder('criteria')
            .where('criteria.wbsItemId = :wbsItemId', {
            wbsItemId: currentEntity.wbsItemId,
        })
            .andWhere('criteria.id != :id', { id })
            .andWhere('TRIM(criteria.criteria) = :criteria', {
            criteria: updateData.criteria.trim(),
        })
            .getOne();
        if (existingCriteria) {
            throw new wbs_evaluation_criteria_exceptions_1.WbsEvaluationCriteriaDuplicateException(currentEntity.wbsItemId, updateData.criteria);
        }
    }
    async 평가기준존재확인한다(id, manager) {
        const repository = this.transactionManager.getRepository(wbs_evaluation_criteria_entity_1.WbsEvaluationCriteria, this.wbsEvaluationCriteriaRepository, manager);
        const count = await repository.count({ where: { id } });
        return count > 0;
    }
    async 특정평가기준존재확인한다(wbsItemId, criteria, manager) {
        const repository = this.transactionManager.getRepository(wbs_evaluation_criteria_entity_1.WbsEvaluationCriteria, this.wbsEvaluationCriteriaRepository, manager);
        const count = await repository
            .createQueryBuilder('criteria')
            .where('criteria.wbsItemId = :wbsItemId', { wbsItemId })
            .andWhere('TRIM(criteria.criteria) = :criteria', {
            criteria: criteria.trim(),
        })
            .getCount();
        return count > 0;
    }
};
exports.WbsEvaluationCriteriaValidationService = WbsEvaluationCriteriaValidationService;
exports.WbsEvaluationCriteriaValidationService = WbsEvaluationCriteriaValidationService = WbsEvaluationCriteriaValidationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(wbs_evaluation_criteria_entity_1.WbsEvaluationCriteria)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        transaction_manager_service_1.TransactionManagerService])
], WbsEvaluationCriteriaValidationService);
//# sourceMappingURL=wbs-evaluation-criteria-validation.service.js.map