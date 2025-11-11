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
var PeerEvaluationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PeerEvaluationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const peer_evaluation_entity_1 = require("./peer-evaluation.entity");
const peer_evaluation_exceptions_1 = require("./peer-evaluation.exceptions");
let PeerEvaluationService = PeerEvaluationService_1 = class PeerEvaluationService {
    peerEvaluationRepository;
    logger = new common_1.Logger(PeerEvaluationService_1.name);
    constructor(peerEvaluationRepository) {
        this.peerEvaluationRepository = peerEvaluationRepository;
    }
    async 생성한다(createData) {
        this.logger.log(`동료평가 생성 시작 - 피평가자: ${createData.evaluateeId}, 평가자: ${createData.evaluatorId}`);
        this.자기_자신_평가_방지_검사(createData.evaluateeId, createData.evaluatorId);
        await this.중복_검사를_수행한다(createData.evaluateeId, createData.evaluatorId, createData.periodId);
        this.유효성을_검사한다(createData);
        try {
            const peerEvaluation = new peer_evaluation_entity_1.PeerEvaluation(createData);
            const saved = await this.peerEvaluationRepository.save(peerEvaluation);
            this.logger.log(`동료평가 생성 완료 - ID: ${saved.id}`);
            return saved;
        }
        catch (error) {
            this.logger.error(`동료평가 생성 실패 - 피평가자: ${createData.evaluateeId}, 평가자: ${createData.evaluatorId}`, error.stack);
            throw error;
        }
    }
    async 수정한다(id, updateData, updatedBy) {
        this.logger.log(`동료평가 수정 시작 - ID: ${id}`);
        const peerEvaluation = await this.조회한다(id);
        if (!peerEvaluation) {
            throw new peer_evaluation_exceptions_1.PeerEvaluationNotFoundException(id);
        }
        try {
            if (updateData.status !== undefined) {
                if (updateData.status === 'completed') {
                    peerEvaluation.평가를_완료한다(updatedBy);
                }
                else if (updateData.status === 'in_progress') {
                    peerEvaluation.진행중으로_변경한다(updatedBy);
                }
                else {
                    peerEvaluation.status = updateData.status;
                    peerEvaluation.메타데이터를_업데이트한다(updatedBy);
                }
            }
            if (updateData.isCompleted !== undefined) {
                if (updateData.isCompleted) {
                    peerEvaluation.평가를_완료한다(updatedBy);
                }
                else {
                    peerEvaluation.isCompleted = false;
                    peerEvaluation.completedAt = undefined;
                    peerEvaluation.메타데이터를_업데이트한다(updatedBy);
                }
            }
            if (updateData.isActive !== undefined) {
                if (updateData.isActive) {
                    peerEvaluation.활성화한다(updatedBy);
                }
                else {
                    peerEvaluation.비활성화한다(updatedBy);
                }
            }
            const saved = await this.peerEvaluationRepository.save(peerEvaluation);
            this.logger.log(`동료평가 수정 완료 - ID: ${id}`);
            return saved;
        }
        catch (error) {
            this.logger.error(`동료평가 수정 실패 - ID: ${id}`, error.stack);
            throw error;
        }
    }
    async 취소한다(id, cancelledBy) {
        this.logger.log(`동료평가 취소 시작 - ID: ${id}`);
        const peerEvaluation = await this.조회한다(id);
        if (!peerEvaluation) {
            throw new peer_evaluation_exceptions_1.PeerEvaluationNotFoundException(id);
        }
        try {
            peerEvaluation.취소한다(cancelledBy);
            const saved = await this.peerEvaluationRepository.save(peerEvaluation);
            this.logger.log(`동료평가 취소 완료 - ID: ${id}`);
            return saved;
        }
        catch (error) {
            this.logger.error(`동료평가 취소 실패 - ID: ${id}`, error.stack);
            throw error;
        }
    }
    async 일괄_취소한다(ids, cancelledBy) {
        this.logger.log(`동료평가 일괄 취소 시작 - 대상 개수: ${ids.length}개`);
        try {
            const evaluations = await this.peerEvaluationRepository.findByIds(ids);
            if (evaluations.length === 0) {
                this.logger.warn(`취소할 동료평가를 찾을 수 없습니다.`);
                return [];
            }
            evaluations.forEach((evaluation) => {
                evaluation.취소한다(cancelledBy);
            });
            const saved = await this.peerEvaluationRepository.save(evaluations);
            this.logger.log(`동료평가 일괄 취소 완료 - 취소된 개수: ${saved.length}개`);
            return saved;
        }
        catch (error) {
            this.logger.error(`동료평가 일괄 취소 실패 - 대상 개수: ${ids.length}개`, error.stack);
            throw error;
        }
    }
    async 삭제한다(id, deletedBy) {
        this.logger.log(`동료평가 삭제 시작 - ID: ${id}`);
        const peerEvaluation = await this.조회한다(id);
        if (!peerEvaluation) {
            throw new peer_evaluation_exceptions_1.PeerEvaluationNotFoundException(id);
        }
        try {
            peerEvaluation.메타데이터를_업데이트한다(deletedBy);
            peerEvaluation.삭제한다();
            await this.peerEvaluationRepository.save(peerEvaluation);
            this.logger.log(`동료평가 삭제 완료 - ID: ${id}`);
        }
        catch (error) {
            this.logger.error(`동료평가 삭제 실패 - ID: ${id}`, error.stack);
            throw error;
        }
    }
    async 조회한다(id) {
        this.logger.debug(`동료평가 조회 - ID: ${id}`);
        try {
            return await this.peerEvaluationRepository.findOne({
                where: { id },
            });
        }
        catch (error) {
            this.logger.error(`동료평가 조회 실패 - ID: ${id}`, error.stack);
            throw error;
        }
    }
    async 필터_조회한다(filter) {
        this.logger.debug(`동료평가 필터 조회 - 필터: ${JSON.stringify(filter)}`);
        try {
            let queryBuilder = this.peerEvaluationRepository.createQueryBuilder('evaluation');
            if (filter.evaluateeId) {
                queryBuilder.andWhere('evaluation.evaluateeId = :evaluateeId', {
                    evaluateeId: filter.evaluateeId,
                });
            }
            if (filter.evaluatorId) {
                queryBuilder.andWhere('evaluation.evaluatorId = :evaluatorId', {
                    evaluatorId: filter.evaluatorId,
                });
            }
            if (filter.periodId) {
                queryBuilder.andWhere('evaluation.periodId = :periodId', {
                    periodId: filter.periodId,
                });
            }
            if (filter.mappedBy) {
                queryBuilder.andWhere('evaluation.mappedBy = :mappedBy', {
                    mappedBy: filter.mappedBy,
                });
            }
            if (filter.status) {
                queryBuilder.andWhere('evaluation.status = :status', {
                    status: filter.status,
                });
            }
            if (filter.completedOnly) {
                queryBuilder.andWhere('evaluation.isCompleted = :isCompleted', {
                    isCompleted: true,
                });
            }
            if (filter.uncompletedOnly) {
                queryBuilder.andWhere('evaluation.isCompleted = :isCompleted', {
                    isCompleted: false,
                });
            }
            if (filter.pendingOnly) {
                queryBuilder.andWhere('evaluation.status = :status', {
                    status: 'pending',
                });
            }
            if (filter.inProgressOnly) {
                queryBuilder.andWhere('evaluation.status = :status', {
                    status: 'in_progress',
                });
            }
            if (filter.activeOnly) {
                queryBuilder.andWhere('evaluation.isActive = :isActive', {
                    isActive: true,
                });
            }
            if (filter.inactiveOnly) {
                queryBuilder.andWhere('evaluation.isActive = :isActive', {
                    isActive: false,
                });
            }
            if (filter.evaluationDateFrom) {
                queryBuilder.andWhere('evaluation.evaluationDate >= :evaluationDateFrom', {
                    evaluationDateFrom: filter.evaluationDateFrom,
                });
            }
            if (filter.evaluationDateTo) {
                queryBuilder.andWhere('evaluation.evaluationDate <= :evaluationDateTo', {
                    evaluationDateTo: filter.evaluationDateTo,
                });
            }
            if (filter.mappedDateFrom) {
                queryBuilder.andWhere('evaluation.mappedDate >= :mappedDateFrom', {
                    mappedDateFrom: filter.mappedDateFrom,
                });
            }
            if (filter.mappedDateTo) {
                queryBuilder.andWhere('evaluation.mappedDate <= :mappedDateTo', {
                    mappedDateTo: filter.mappedDateTo,
                });
            }
            const orderBy = filter.orderBy || 'evaluationDate';
            const orderDirection = filter.orderDirection || 'DESC';
            queryBuilder.orderBy(`evaluation.${orderBy}`, orderDirection);
            if (filter.page && filter.limit) {
                const offset = (filter.page - 1) * filter.limit;
                queryBuilder.skip(offset).take(filter.limit);
            }
            return await queryBuilder.getMany();
        }
        catch (error) {
            this.logger.error(`동료평가 필터 조회 실패 - 필터: ${JSON.stringify(filter)}`, error.stack);
            throw error;
        }
    }
    async 완료한다(id, completedBy) {
        this.logger.log(`동료평가 완료 처리 시작 - ID: ${id}`);
        const peerEvaluation = await this.조회한다(id);
        if (!peerEvaluation) {
            throw new peer_evaluation_exceptions_1.PeerEvaluationNotFoundException(id);
        }
        try {
            peerEvaluation.평가를_완료한다(completedBy);
            const saved = await this.peerEvaluationRepository.save(peerEvaluation);
            this.logger.log(`동료평가 완료 처리 완료 - ID: ${id}`);
            return saved;
        }
        catch (error) {
            this.logger.error(`동료평가 완료 처리 실패 - ID: ${id}`, error.stack);
            throw error;
        }
    }
    async 진행중으로_변경한다(id, updatedBy) {
        this.logger.log(`동료평가 진행중 변경 시작 - ID: ${id}`);
        const peerEvaluation = await this.조회한다(id);
        if (!peerEvaluation) {
            throw new peer_evaluation_exceptions_1.PeerEvaluationNotFoundException(id);
        }
        try {
            peerEvaluation.진행중으로_변경한다(updatedBy);
            const saved = await this.peerEvaluationRepository.save(peerEvaluation);
            this.logger.log(`동료평가 진행중 변경 완료 - ID: ${id}`);
            return saved;
        }
        catch (error) {
            this.logger.error(`동료평가 진행중 변경 실패 - ID: ${id}`, error.stack);
            throw error;
        }
    }
    async 피평가자별_조회한다(evaluateeId) {
        this.logger.debug(`피평가자별 동료평가 조회 - 피평가자: ${evaluateeId}`);
        try {
            return await this.필터_조회한다({ evaluateeId });
        }
        catch (error) {
            this.logger.error(`피평가자별 동료평가 조회 실패 - 피평가자: ${evaluateeId}`, error.stack);
            throw error;
        }
    }
    async 평가자별_조회한다(evaluatorId) {
        this.logger.debug(`평가자별 동료평가 조회 - 평가자: ${evaluatorId}`);
        try {
            return await this.필터_조회한다({ evaluatorId });
        }
        catch (error) {
            this.logger.error(`평가자별 동료평가 조회 실패 - 평가자: ${evaluatorId}`, error.stack);
            throw error;
        }
    }
    async 평가기간별_조회한다(periodId) {
        this.logger.debug(`평가기간별 동료평가 조회 - 기간: ${periodId}`);
        try {
            return await this.필터_조회한다({ periodId });
        }
        catch (error) {
            this.logger.error(`평가기간별 동료평가 조회 실패 - 기간: ${periodId}`, error.stack);
            throw error;
        }
    }
    async 활성화한다(id, activatedBy) {
        this.logger.log(`동료평가 활성화 시작 - ID: ${id}`);
        const peerEvaluation = await this.조회한다(id);
        if (!peerEvaluation) {
            throw new peer_evaluation_exceptions_1.PeerEvaluationNotFoundException(id);
        }
        try {
            peerEvaluation.활성화한다(activatedBy);
            const saved = await this.peerEvaluationRepository.save(peerEvaluation);
            this.logger.log(`동료평가 활성화 완료 - ID: ${id}`);
            return saved;
        }
        catch (error) {
            this.logger.error(`동료평가 활성화 실패 - ID: ${id}`, error.stack);
            throw error;
        }
    }
    async 비활성화한다(id, deactivatedBy) {
        this.logger.log(`동료평가 비활성화 시작 - ID: ${id}`);
        const peerEvaluation = await this.조회한다(id);
        if (!peerEvaluation) {
            throw new peer_evaluation_exceptions_1.PeerEvaluationNotFoundException(id);
        }
        try {
            peerEvaluation.비활성화한다(deactivatedBy);
            const saved = await this.peerEvaluationRepository.save(peerEvaluation);
            this.logger.log(`동료평가 비활성화 완료 - ID: ${id}`);
            return saved;
        }
        catch (error) {
            this.logger.error(`동료평가 비활성화 실패 - ID: ${id}`, error.stack);
            throw error;
        }
    }
    자기_자신_평가_방지_검사(evaluateeId, evaluatorId) {
        if (evaluateeId === evaluatorId) {
            throw new peer_evaluation_exceptions_1.SelfPeerEvaluationException(evaluateeId);
        }
    }
    async 중복_검사를_수행한다(evaluateeId, evaluatorId, periodId) {
    }
    유효성을_검사한다(data) {
        if (!data.evaluateeId) {
            throw new peer_evaluation_exceptions_1.PeerEvaluationValidationException('피평가자 ID는 필수입니다.');
        }
        if (!data.evaluatorId) {
            throw new peer_evaluation_exceptions_1.PeerEvaluationValidationException('평가자 ID는 필수입니다.');
        }
        if (!data.periodId) {
            throw new peer_evaluation_exceptions_1.PeerEvaluationValidationException('평가 기간 ID는 필수입니다.');
        }
    }
};
exports.PeerEvaluationService = PeerEvaluationService;
exports.PeerEvaluationService = PeerEvaluationService = PeerEvaluationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(peer_evaluation_entity_1.PeerEvaluation)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PeerEvaluationService);
//# sourceMappingURL=peer-evaluation.service.js.map