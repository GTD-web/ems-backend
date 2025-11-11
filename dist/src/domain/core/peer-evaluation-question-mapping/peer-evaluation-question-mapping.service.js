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
var PeerEvaluationQuestionMappingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PeerEvaluationQuestionMappingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const peer_evaluation_question_mapping_entity_1 = require("./peer-evaluation-question-mapping.entity");
const peer_evaluation_question_mapping_exceptions_1 = require("./peer-evaluation-question-mapping.exceptions");
let PeerEvaluationQuestionMappingService = PeerEvaluationQuestionMappingService_1 = class PeerEvaluationQuestionMappingService {
    mappingRepository;
    logger = new common_1.Logger(PeerEvaluationQuestionMappingService_1.name);
    constructor(mappingRepository) {
        this.mappingRepository = mappingRepository;
    }
    async ID로조회한다(id) {
        this.logger.log(`동료평가 질문 매핑 조회 - ID: ${id}`);
        return await this.mappingRepository.findOne({
            where: { id, deletedAt: (0, typeorm_2.IsNull)() },
        });
    }
    async 동료평가의_질문목록을_조회한다(peerEvaluationId) {
        this.logger.log(`동료평가의 질문 목록 조회 - peerEvaluationId: ${peerEvaluationId}`);
        return await this.mappingRepository.find({
            where: { peerEvaluationId, deletedAt: (0, typeorm_2.IsNull)() },
            order: { displayOrder: 'ASC' },
        });
    }
    async 질문이_사용된_동료평가목록을_조회한다(questionId) {
        this.logger.log(`질문이 사용된 동료평가 목록 조회 - questionId: ${questionId}`);
        return await this.mappingRepository.find({
            where: { questionId, deletedAt: (0, typeorm_2.IsNull)() },
            order: { createdAt: 'DESC' },
        });
    }
    async 필터조회한다(filter) {
        this.logger.log('필터로 동료평가 질문 매핑 조회', filter);
        const queryBuilder = this.mappingRepository
            .createQueryBuilder('mapping')
            .where('mapping.deletedAt IS NULL');
        if (filter.peerEvaluationId) {
            queryBuilder.andWhere('mapping.peerEvaluationId = :peerEvaluationId', {
                peerEvaluationId: filter.peerEvaluationId,
            });
        }
        if (filter.questionId) {
            queryBuilder.andWhere('mapping.questionId = :questionId', {
                questionId: filter.questionId,
            });
        }
        if (filter.questionGroupId) {
            queryBuilder.andWhere('mapping.questionGroupId = :questionGroupId', {
                questionGroupId: filter.questionGroupId,
            });
        }
        queryBuilder.orderBy('mapping.displayOrder', 'ASC');
        return await queryBuilder.getMany();
    }
    async 생성한다(createDto, createdBy) {
        this.logger.log(`동료평가 질문 매핑 생성 - peerEvaluationId: ${createDto.peerEvaluationId}, questionId: ${createDto.questionId}`);
        const exists = await this.매핑중복확인한다(createDto.peerEvaluationId, createDto.questionId);
        if (exists) {
            throw new peer_evaluation_question_mapping_exceptions_1.DuplicatePeerEvaluationQuestionMappingException(createDto.peerEvaluationId, createDto.questionId);
        }
        try {
            const mapping = new peer_evaluation_question_mapping_entity_1.PeerEvaluationQuestionMapping({
                ...createDto,
                createdBy,
            });
            const saved = await this.mappingRepository.save(mapping);
            this.logger.log(`동료평가 질문 매핑 생성 완료 - ID: ${saved.id}`);
            return saved;
        }
        catch (error) {
            this.logger.error('동료평가 질문 매핑 생성 실패', error.stack);
            throw error;
        }
    }
    async 업데이트한다(id, updateDto, updatedBy) {
        this.logger.log(`동료평가 질문 매핑 수정 - ID: ${id}`);
        const mapping = await this.ID로조회한다(id);
        if (!mapping) {
            throw new peer_evaluation_question_mapping_exceptions_1.PeerEvaluationQuestionMappingNotFoundException(id);
        }
        try {
            if (updateDto.displayOrder !== undefined) {
                mapping.표시순서변경한다(updateDto.displayOrder, updatedBy);
            }
            const saved = await this.mappingRepository.save(mapping);
            this.logger.log(`동료평가 질문 매핑 수정 완료 - ID: ${id}`);
            return saved;
        }
        catch (error) {
            this.logger.error(`동료평가 질문 매핑 수정 실패 - ID: ${id}`, error.stack);
            throw error;
        }
    }
    async 삭제한다(id, deletedBy) {
        this.logger.log(`동료평가 질문 매핑 삭제 - ID: ${id}`);
        const mapping = await this.ID로조회한다(id);
        if (!mapping) {
            throw new peer_evaluation_question_mapping_exceptions_1.PeerEvaluationQuestionMappingNotFoundException(id);
        }
        try {
            mapping.deletedAt = new Date();
            mapping.메타데이터를_업데이트한다(deletedBy);
            await this.mappingRepository.save(mapping);
            this.logger.log(`동료평가 질문 매핑 삭제 완료 - ID: ${id}`);
        }
        catch (error) {
            this.logger.error(`동료평가 질문 매핑 삭제 실패 - ID: ${id}`, error.stack);
            throw error;
        }
    }
    async 동료평가의_질문매핑을_전체삭제한다(peerEvaluationId, deletedBy) {
        this.logger.log(`동료평가의 모든 질문 매핑 삭제 - peerEvaluationId: ${peerEvaluationId}`);
        const mappings = await this.동료평가의_질문목록을_조회한다(peerEvaluationId);
        try {
            for (const mapping of mappings) {
                mapping.deletedAt = new Date();
                mapping.메타데이터를_업데이트한다(deletedBy);
            }
            await this.mappingRepository.save(mappings);
            this.logger.log(`동료평가의 모든 질문 매핑 삭제 완료 - 삭제 개수: ${mappings.length}`);
        }
        catch (error) {
            this.logger.error(`동료평가의 모든 질문 매핑 삭제 실패 - peerEvaluationId: ${peerEvaluationId}`, error.stack);
            throw error;
        }
    }
    async 매핑중복확인한다(peerEvaluationId, questionId) {
        const count = await this.mappingRepository.count({
            where: { peerEvaluationId, questionId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        return count > 0;
    }
    async 동료평가의_질문개수를_조회한다(peerEvaluationId) {
        return await this.mappingRepository.count({
            where: { peerEvaluationId, deletedAt: (0, typeorm_2.IsNull)() },
        });
    }
    async 질문그룹의_질문들을_일괄추가한다(peerEvaluationId, questionGroupId, questionIds, startDisplayOrder, createdBy) {
        this.logger.log(`동료평가에 질문 그룹 일괄 추가 - peerEvaluationId: ${peerEvaluationId}, questionGroupId: ${questionGroupId}, 질문 수: ${questionIds.length}`);
        try {
            const mappings = [];
            for (let i = 0; i < questionIds.length; i++) {
                const questionId = questionIds[i];
                const exists = await this.매핑중복확인한다(peerEvaluationId, questionId);
                if (exists) {
                    this.logger.warn(`이미 추가된 질문 건너뛰기 - questionId: ${questionId}`);
                    continue;
                }
                const mapping = new peer_evaluation_question_mapping_entity_1.PeerEvaluationQuestionMapping({
                    peerEvaluationId,
                    questionId,
                    questionGroupId,
                    displayOrder: startDisplayOrder + i,
                    createdBy,
                });
                mappings.push(mapping);
            }
            const saved = await this.mappingRepository.save(mappings);
            this.logger.log(`질문 그룹 일괄 추가 완료 - 추가된 질문 수: ${saved.length}`);
            return saved;
        }
        catch (error) {
            this.logger.error(`질문 그룹 일괄 추가 실패 - peerEvaluationId: ${peerEvaluationId}`, error.stack);
            throw error;
        }
    }
    async 동료평가의_그룹질문목록을_조회한다(peerEvaluationId, questionGroupId) {
        this.logger.log(`동료평가의 그룹 질문 목록 조회 - peerEvaluationId: ${peerEvaluationId}, questionGroupId: ${questionGroupId}`);
        return await this.mappingRepository.find({
            where: { peerEvaluationId, questionGroupId, deletedAt: (0, typeorm_2.IsNull)() },
            order: { displayOrder: 'ASC' },
        });
    }
    async 동료평가와_질문으로_조회한다(peerEvaluationId, questionId) {
        this.logger.log(`동료평가와 질문으로 매핑 조회 - peerEvaluationId: ${peerEvaluationId}, questionId: ${questionId}`);
        return await this.mappingRepository.findOne({
            where: { peerEvaluationId, questionId, deletedAt: (0, typeorm_2.IsNull)() },
        });
    }
    async 저장한다(mapping) {
        return await this.mappingRepository.save(mapping);
    }
};
exports.PeerEvaluationQuestionMappingService = PeerEvaluationQuestionMappingService;
exports.PeerEvaluationQuestionMappingService = PeerEvaluationQuestionMappingService = PeerEvaluationQuestionMappingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(peer_evaluation_question_mapping_entity_1.PeerEvaluationQuestionMapping)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PeerEvaluationQuestionMappingService);
//# sourceMappingURL=peer-evaluation-question-mapping.service.js.map