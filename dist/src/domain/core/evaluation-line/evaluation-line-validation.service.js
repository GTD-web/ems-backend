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
var EvaluationLineValidationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationLineValidationService = void 0;
const transaction_manager_service_1 = require("../../../../libs/database/transaction-manager.service");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_line_entity_1 = require("./evaluation-line.entity");
const evaluation_line_exceptions_1 = require("./evaluation-line.exceptions");
const evaluation_line_types_1 = require("./evaluation-line.types");
let EvaluationLineValidationService = EvaluationLineValidationService_1 = class EvaluationLineValidationService {
    evaluationLineRepository;
    transactionManager;
    logger = new common_1.Logger(EvaluationLineValidationService_1.name);
    constructor(evaluationLineRepository, transactionManager) {
        this.evaluationLineRepository = evaluationLineRepository;
        this.transactionManager = transactionManager;
    }
    async 생성데이터검증한다(createData, manager) {
        this.logger.debug('평가 라인 생성 데이터 검증 시작');
        this.필수데이터검증한다(createData);
        this.데이터형식검증한다(createData);
        await this.비즈니스규칙검증한다(createData, manager);
        await this.중복검증한다(createData, manager);
        this.logger.debug('평가 라인 생성 데이터 검증 완료');
    }
    async 업데이트데이터검증한다(id, updateData, manager) {
        this.logger.debug(`평가 라인 업데이트 데이터 검증 시작 - ID: ${id}`);
        if (Object.keys(updateData).length === 0) {
            throw new evaluation_line_exceptions_1.EvaluationLineRequiredDataMissingException('업데이트할 데이터가 없습니다.');
        }
        this.업데이트데이터형식검증한다(updateData);
        if (updateData.order !== undefined) {
            await this.순서중복검증한다(updateData.order, id, manager);
        }
        this.logger.debug(`평가 라인 업데이트 데이터 검증 완료 - ID: ${id}`);
    }
    필수데이터검증한다(createData) {
        if (!createData.evaluatorType) {
            throw new evaluation_line_exceptions_1.EvaluationLineRequiredDataMissingException('평가자 유형은 필수입니다.');
        }
        if (createData.order === undefined || createData.order === null) {
            throw new evaluation_line_exceptions_1.EvaluationLineRequiredDataMissingException('평가 순서는 필수입니다.');
        }
    }
    데이터형식검증한다(createData) {
        if (!Object.values(evaluation_line_types_1.EvaluatorType).includes(createData.evaluatorType)) {
            throw new evaluation_line_exceptions_1.InvalidEvaluationLineDataFormatException(`유효하지 않은 평가자 유형입니다: ${createData.evaluatorType}`);
        }
        if (!Number.isInteger(createData.order) || createData.order < 1) {
            throw new evaluation_line_exceptions_1.InvalidEvaluationLineDataFormatException('평가 순서는 1 이상의 정수여야 합니다.');
        }
        if (createData.isRequired !== undefined &&
            typeof createData.isRequired !== 'boolean') {
            throw new evaluation_line_exceptions_1.InvalidEvaluationLineDataFormatException('필수 평가자 여부는 불린 값이어야 합니다.');
        }
        if (createData.isAutoAssigned !== undefined &&
            typeof createData.isAutoAssigned !== 'boolean') {
            throw new evaluation_line_exceptions_1.InvalidEvaluationLineDataFormatException('자동 할당 여부는 불린 값이어야 합니다.');
        }
    }
    업데이트데이터형식검증한다(updateData) {
        if (updateData.evaluatorType !== undefined &&
            !Object.values(evaluation_line_types_1.EvaluatorType).includes(updateData.evaluatorType)) {
            throw new evaluation_line_exceptions_1.InvalidEvaluationLineDataFormatException(`유효하지 않은 평가자 유형입니다: ${updateData.evaluatorType}`);
        }
        if (updateData.order !== undefined &&
            (!Number.isInteger(updateData.order) || updateData.order < 1)) {
            throw new evaluation_line_exceptions_1.InvalidEvaluationLineDataFormatException('평가 순서는 1 이상의 정수여야 합니다.');
        }
        if (updateData.isRequired !== undefined &&
            typeof updateData.isRequired !== 'boolean') {
            throw new evaluation_line_exceptions_1.InvalidEvaluationLineDataFormatException('필수 평가자 여부는 불린 값이어야 합니다.');
        }
        if (updateData.isAutoAssigned !== undefined &&
            typeof updateData.isAutoAssigned !== 'boolean') {
            throw new evaluation_line_exceptions_1.InvalidEvaluationLineDataFormatException('자동 할당 여부는 불린 값이어야 합니다.');
        }
    }
    async 비즈니스규칙검증한다(createData, manager) {
        if (createData.isAutoAssigned && createData.isRequired === false) {
            this.logger.warn('자동 할당 평가자가 필수가 아닌 것은 권장되지 않습니다.');
        }
    }
    async 중복검증한다(createData, manager) {
        await this.순서중복검증한다(createData.order, undefined, manager);
    }
    async 순서중복검증한다(order, excludeId, manager) {
        const repository = this.transactionManager.getRepository(evaluation_line_entity_1.EvaluationLine, this.evaluationLineRepository, manager);
        let queryBuilder = repository
            .createQueryBuilder('evaluationLine')
            .where('evaluationLine.order = :order', { order });
        if (excludeId) {
            queryBuilder.andWhere('evaluationLine.id != :excludeId', { excludeId });
        }
        const existingEvaluationLine = await queryBuilder.getOne();
        if (existingEvaluationLine) {
            throw new evaluation_line_exceptions_1.EvaluationLineDuplicateException(`순서 ${order}는 이미 사용 중입니다.`);
        }
    }
    async 평가라인존재확인한다(id, manager) {
        const repository = this.transactionManager.getRepository(evaluation_line_entity_1.EvaluationLine, this.evaluationLineRepository, manager);
        const count = await repository.count({ where: { id } });
        return count > 0;
    }
};
exports.EvaluationLineValidationService = EvaluationLineValidationService;
exports.EvaluationLineValidationService = EvaluationLineValidationService = EvaluationLineValidationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(evaluation_line_entity_1.EvaluationLine)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        transaction_manager_service_1.TransactionManagerService])
], EvaluationLineValidationService);
//# sourceMappingURL=evaluation-line-validation.service.js.map