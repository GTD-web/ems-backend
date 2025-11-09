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
var EvaluationLineService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationLineService = void 0;
const transaction_manager_service_1 = require("../../../../libs/database/transaction-manager.service");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_line_validation_service_1 = require("./evaluation-line-validation.service");
const evaluation_line_entity_1 = require("./evaluation-line.entity");
const evaluation_line_exceptions_1 = require("./evaluation-line.exceptions");
let EvaluationLineService = EvaluationLineService_1 = class EvaluationLineService {
    evaluationLineRepository;
    transactionManager;
    validationService;
    logger = new common_1.Logger(EvaluationLineService_1.name);
    constructor(evaluationLineRepository, transactionManager, validationService) {
        this.evaluationLineRepository = evaluationLineRepository;
        this.transactionManager = transactionManager;
        this.validationService = validationService;
    }
    async executeSafeDomainOperation(operation, context) {
        return this.transactionManager.executeSafeOperation(operation, context);
    }
    async ID로_조회한다(id, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_line_entity_1.EvaluationLine, this.evaluationLineRepository, manager);
            const evaluationLine = await repository.findOne({
                where: { id },
            });
            this.logger.debug(`평가 라인 조회 완료 - ID: ${id}`);
            return evaluationLine;
        }, 'ID로_조회한다');
    }
    async 전체_조회한다(manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_line_entity_1.EvaluationLine, this.evaluationLineRepository, manager);
            const evaluationLines = await repository.find({
                order: { order: 'ASC' },
            });
            this.logger.debug(`전체 평가 라인 조회 완료 - 개수: ${evaluationLines.length}`);
            return evaluationLines;
        }, '전체_조회한다');
    }
    async 필터_조회한다(filter, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_line_entity_1.EvaluationLine, this.evaluationLineRepository, manager);
            let queryBuilder = repository.createQueryBuilder('evaluationLine');
            if (filter.evaluatorType) {
                queryBuilder.andWhere('evaluationLine.evaluatorType = :evaluatorType', {
                    evaluatorType: filter.evaluatorType,
                });
            }
            if (filter.requiredOnly) {
                queryBuilder.andWhere('evaluationLine.isRequired = :isRequired', {
                    isRequired: true,
                });
            }
            if (filter.autoAssignedOnly) {
                queryBuilder.andWhere('evaluationLine.isAutoAssigned = :isAutoAssigned', {
                    isAutoAssigned: true,
                });
            }
            if (filter.orderFrom !== undefined) {
                queryBuilder.andWhere('evaluationLine.order >= :orderFrom', {
                    orderFrom: filter.orderFrom,
                });
            }
            if (filter.orderTo !== undefined) {
                queryBuilder.andWhere('evaluationLine.order <= :orderTo', {
                    orderTo: filter.orderTo,
                });
            }
            queryBuilder.orderBy('evaluationLine.order', 'ASC');
            const evaluationLines = await queryBuilder.getMany();
            this.logger.debug(`필터 조건 평가 라인 조회 완료 - 개수: ${evaluationLines.length}`);
            return evaluationLines;
        }, '필터_조회한다');
    }
    async 생성한다(createData, manager) {
        return this.executeSafeDomainOperation(async () => {
            await this.validationService.생성데이터검증한다(createData, manager);
            const repository = this.transactionManager.getRepository(evaluation_line_entity_1.EvaluationLine, this.evaluationLineRepository, manager);
            const evaluationLine = repository.create({
                evaluatorType: createData.evaluatorType,
                order: createData.order,
                isRequired: createData.isRequired ?? true,
                isAutoAssigned: createData.isAutoAssigned ?? false,
            });
            const savedEvaluationLine = await repository.save(evaluationLine);
            this.logger.log(`평가 라인 생성 완료 - ID: ${savedEvaluationLine.id}, 유형: ${savedEvaluationLine.evaluatorType}, 순서: ${savedEvaluationLine.order}`);
            return savedEvaluationLine;
        }, '생성한다');
    }
    async 업데이트한다(id, updateData, updatedBy, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_line_entity_1.EvaluationLine, this.evaluationLineRepository, manager);
            const evaluationLine = await repository.findOne({ where: { id } });
            if (!evaluationLine) {
                throw new evaluation_line_exceptions_1.EvaluationLineNotFoundException(id);
            }
            await this.validationService.업데이트데이터검증한다(id, updateData, manager);
            if (updateData.evaluatorType !== undefined) {
                evaluationLine.평가자_유형을_변경한다(updateData.evaluatorType);
            }
            if (updateData.order !== undefined) {
                evaluationLine.평가_순서를_변경한다(updateData.order);
            }
            if (updateData.isRequired !== undefined) {
                evaluationLine.필수_평가자_여부를_변경한다(updateData.isRequired);
            }
            if (updateData.isAutoAssigned !== undefined) {
                evaluationLine.자동_할당_여부를_변경한다(updateData.isAutoAssigned);
            }
            const updatedEvaluationLine = await repository.save(evaluationLine);
            this.logger.log(`평가 라인 업데이트 완료 - ID: ${id}, 수정자: ${updatedBy}`);
            return updatedEvaluationLine;
        }, '업데이트한다');
    }
    async 삭제한다(id, deletedBy, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_line_entity_1.EvaluationLine, this.evaluationLineRepository, manager);
            const evaluationLine = await repository.findOne({ where: { id } });
            if (!evaluationLine) {
                throw new evaluation_line_exceptions_1.EvaluationLineNotFoundException(id);
            }
            evaluationLine.deletedAt = new Date();
            evaluationLine.수정자를_설정한다(deletedBy);
            await repository.save(evaluationLine);
            this.logger.log(`평가 라인 삭제 완료 - ID: ${id}, 삭제자: ${deletedBy}`);
        }, '삭제한다');
    }
    async 순서_중복_확인한다(order, excludeId, manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_line_entity_1.EvaluationLine, this.evaluationLineRepository, manager);
            let queryBuilder = repository
                .createQueryBuilder('evaluationLine')
                .where('evaluationLine.order = :order', { order });
            if (excludeId) {
                queryBuilder.andWhere('evaluationLine.id != :excludeId', { excludeId });
            }
            const count = await queryBuilder.getCount();
            return count > 0;
        }, '순서_중복_확인한다');
    }
    async 다음_순서_조회한다(manager) {
        return this.executeSafeDomainOperation(async () => {
            const repository = this.transactionManager.getRepository(evaluation_line_entity_1.EvaluationLine, this.evaluationLineRepository, manager);
            const result = await repository
                .createQueryBuilder('evaluationLine')
                .select('MAX(evaluationLine.order)', 'maxOrder')
                .getRawOne();
            const maxOrder = result?.maxOrder || 0;
            return maxOrder + 1;
        }, '다음_순서_조회한다');
    }
};
exports.EvaluationLineService = EvaluationLineService;
exports.EvaluationLineService = EvaluationLineService = EvaluationLineService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(evaluation_line_entity_1.EvaluationLine)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        transaction_manager_service_1.TransactionManagerService,
        evaluation_line_validation_service_1.EvaluationLineValidationService])
], EvaluationLineService);
//# sourceMappingURL=evaluation-line.service.js.map