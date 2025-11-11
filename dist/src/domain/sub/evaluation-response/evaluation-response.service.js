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
var EvaluationResponseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationResponseService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_response_entity_1 = require("./evaluation-response.entity");
const evaluation_response_exceptions_1 = require("./evaluation-response.exceptions");
let EvaluationResponseService = EvaluationResponseService_1 = class EvaluationResponseService {
    evaluationResponseRepository;
    logger = new common_1.Logger(EvaluationResponseService_1.name);
    constructor(evaluationResponseRepository) {
        this.evaluationResponseRepository = evaluationResponseRepository;
    }
    async ID로조회한다(id) {
        this.logger.log(`평가 응답 조회 - ID: ${id}`);
        return await this.evaluationResponseRepository.findOne({
            where: { id, deletedAt: (0, typeorm_2.IsNull)() },
        });
    }
    async 질문별조회한다(questionId) {
        this.logger.log(`평가 응답 조회 - 질문 ID: ${questionId}`);
        return await this.evaluationResponseRepository.find({
            where: { questionId, deletedAt: (0, typeorm_2.IsNull)() },
            order: { createdAt: 'ASC' },
        });
    }
    async 평가별조회한다(evaluationId) {
        this.logger.log(`평가 응답 조회 - 평가 ID: ${evaluationId}`);
        return await this.evaluationResponseRepository.find({
            where: { evaluationId, deletedAt: (0, typeorm_2.IsNull)() },
            order: { createdAt: 'ASC' },
        });
    }
    async 질문평가별조회한다(questionId, evaluationId) {
        this.logger.log(`평가 응답 조회 - 질문 ID: ${questionId}, 평가 ID: ${evaluationId}`);
        return await this.evaluationResponseRepository.findOne({
            where: { questionId, evaluationId, deletedAt: (0, typeorm_2.IsNull)() },
        });
    }
    async 평가유형별조회한다(evaluationType) {
        this.logger.log(`평가 응답 조회 - 평가 유형: ${evaluationType}`);
        return await this.evaluationResponseRepository.find({
            where: { evaluationType, deletedAt: (0, typeorm_2.IsNull)() },
            order: { createdAt: 'ASC' },
        });
    }
    async 평가유형조합조회한다(evaluationId, evaluationType) {
        this.logger.log(`평가 응답 조회 - 평가 ID: ${evaluationId}, 평가 유형: ${evaluationType}`);
        return await this.evaluationResponseRepository.find({
            where: { evaluationId, evaluationType, deletedAt: (0, typeorm_2.IsNull)() },
            order: { createdAt: 'ASC' },
        });
    }
    async 전체조회한다() {
        this.logger.log('전체 평가 응답 조회');
        return await this.evaluationResponseRepository.find({
            where: { deletedAt: (0, typeorm_2.IsNull)() },
            order: { createdAt: 'ASC' },
        });
    }
    async 필터조회한다(filter) {
        this.logger.log('필터 조건으로 평가 응답 조회', filter);
        const queryBuilder = this.evaluationResponseRepository
            .createQueryBuilder('response')
            .where('response.deletedAt IS NULL');
        if (filter.questionId) {
            queryBuilder.andWhere('response.questionId = :questionId', {
                questionId: filter.questionId,
            });
        }
        if (filter.evaluationId) {
            queryBuilder.andWhere('response.evaluationId = :evaluationId', {
                evaluationId: filter.evaluationId,
            });
        }
        if (filter.evaluationType) {
            queryBuilder.andWhere('response.evaluationType = :evaluationType', {
                evaluationType: filter.evaluationType,
            });
        }
        if (filter.answerSearch) {
            queryBuilder.andWhere('response.answer LIKE :answerSearch', {
                answerSearch: `%${filter.answerSearch}%`,
            });
        }
        if (filter.minScore !== undefined) {
            queryBuilder.andWhere('response.score >= :minScore', {
                minScore: filter.minScore,
            });
        }
        if (filter.maxScore !== undefined) {
            queryBuilder.andWhere('response.score <= :maxScore', {
                maxScore: filter.maxScore,
            });
        }
        queryBuilder.orderBy('response.createdAt', 'ASC');
        return await queryBuilder.getMany();
    }
    async 생성한다(createDto, createdBy) {
        this.logger.log(`평가 응답 생성 시작 - 질문 ID: ${createDto.questionId}, 평가 ID: ${createDto.evaluationId}`);
        const exists = await this.응답중복확인한다(createDto.questionId, createDto.evaluationId);
        if (exists) {
            throw new evaluation_response_exceptions_1.DuplicateEvaluationResponseException(createDto.questionId, createDto.evaluationId);
        }
        try {
            const evaluationResponse = new evaluation_response_entity_1.EvaluationResponse({
                ...createDto,
                createdBy,
            });
            const saved = await this.evaluationResponseRepository.save(evaluationResponse);
            this.logger.log(`평가 응답 생성 완료 - ID: ${saved.id}`);
            return saved;
        }
        catch (error) {
            this.logger.error(`평가 응답 생성 실패 - 질문 ID: ${createDto.questionId}, 평가 ID: ${createDto.evaluationId}`, error.stack);
            throw error;
        }
    }
    async 업데이트한다(id, updateDto, updatedBy) {
        this.logger.log(`평가 응답 수정 시작 - ID: ${id}`);
        const evaluationResponse = await this.ID로조회한다(id);
        if (!evaluationResponse) {
            throw new evaluation_response_exceptions_1.EvaluationResponseNotFoundException(id);
        }
        try {
            if (updateDto.answer !== undefined && updateDto.score !== undefined) {
                evaluationResponse.응답전체업데이트한다(updateDto.answer, updateDto.score, updatedBy);
            }
            else if (updateDto.answer !== undefined) {
                evaluationResponse.응답내용업데이트한다(updateDto.answer, updatedBy);
            }
            else if (updateDto.score !== undefined) {
                evaluationResponse.응답점수업데이트한다(updateDto.score, updatedBy);
            }
            const saved = await this.evaluationResponseRepository.save(evaluationResponse);
            this.logger.log(`평가 응답 수정 완료 - ID: ${id}`);
            return saved;
        }
        catch (error) {
            this.logger.error(`평가 응답 수정 실패 - ID: ${id}`, error.stack);
            throw error;
        }
    }
    async 삭제한다(id, deletedBy) {
        this.logger.log(`평가 응답 삭제 시작 - ID: ${id}`);
        const evaluationResponse = await this.ID로조회한다(id);
        if (!evaluationResponse) {
            throw new evaluation_response_exceptions_1.EvaluationResponseNotFoundException(id);
        }
        try {
            evaluationResponse.deletedAt = new Date();
            evaluationResponse.메타데이터를_업데이트한다(deletedBy);
            await this.evaluationResponseRepository.save(evaluationResponse);
            this.logger.log(`평가 응답 삭제 완료 - ID: ${id}`);
        }
        catch (error) {
            this.logger.error(`평가 응답 삭제 실패 - ID: ${id}`, error.stack);
            throw error;
        }
    }
    async 질문응답전체삭제한다(questionId, deletedBy) {
        this.logger.log(`질문의 모든 응답 삭제 시작 - 질문 ID: ${questionId}`);
        const responses = await this.질문별조회한다(questionId);
        try {
            for (const response of responses) {
                response.deletedAt = new Date();
                response.메타데이터를_업데이트한다(deletedBy);
            }
            await this.evaluationResponseRepository.save(responses);
            this.logger.log(`질문의 모든 응답 삭제 완료 - 질문 ID: ${questionId}, 삭제 개수: ${responses.length}`);
        }
        catch (error) {
            this.logger.error(`질문의 모든 응답 삭제 실패 - 질문 ID: ${questionId}`, error.stack);
            throw error;
        }
    }
    async 평가응답전체삭제한다(evaluationId, deletedBy) {
        this.logger.log(`평가의 모든 응답 삭제 시작 - 평가 ID: ${evaluationId}`);
        const responses = await this.평가별조회한다(evaluationId);
        try {
            for (const response of responses) {
                response.deletedAt = new Date();
                response.메타데이터를_업데이트한다(deletedBy);
            }
            await this.evaluationResponseRepository.save(responses);
            this.logger.log(`평가의 모든 응답 삭제 완료 - 평가 ID: ${evaluationId}, 삭제 개수: ${responses.length}`);
        }
        catch (error) {
            this.logger.error(`평가의 모든 응답 삭제 실패 - 평가 ID: ${evaluationId}`, error.stack);
            throw error;
        }
    }
    async 응답중복확인한다(questionId, evaluationId) {
        const count = await this.evaluationResponseRepository.count({
            where: { questionId, evaluationId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        return count > 0;
    }
    async 질문응답개수조회한다(questionId) {
        return await this.evaluationResponseRepository.count({
            where: { questionId, deletedAt: (0, typeorm_2.IsNull)() },
        });
    }
    async 평가응답개수조회한다(evaluationId) {
        return await this.evaluationResponseRepository.count({
            where: { evaluationId, deletedAt: (0, typeorm_2.IsNull)() },
        });
    }
    async 평가유형별응답개수조회한다(evaluationType) {
        return await this.evaluationResponseRepository.count({
            where: { evaluationType, deletedAt: (0, typeorm_2.IsNull)() },
        });
    }
    async 질문응답통계조회한다(questionId) {
        const responses = await this.질문별조회한다(questionId);
        return this.통계를_계산한다(responses);
    }
    async 평가응답통계조회한다(evaluationId) {
        const responses = await this.평가별조회한다(evaluationId);
        return this.통계를_계산한다(responses);
    }
    async 평가유형별응답통계조회한다(evaluationType) {
        const responses = await this.평가유형별조회한다(evaluationType);
        return this.통계를_계산한다(responses);
    }
    async 평가완료율조회한다(evaluationId) {
        return 100;
    }
    async 평가완료확인한다(evaluationId) {
        const completionRate = await this.평가완료율조회한다(evaluationId);
        return completionRate === 100;
    }
    통계를_계산한다(responses) {
        const totalCount = responses.length;
        const scores = responses
            .filter((r) => r.score !== undefined)
            .map((r) => r.score);
        const countByType = {
            self: 0,
            peer: 0,
            additional: 0,
            downward: 0,
        };
        responses.forEach((response) => {
            countByType[response.evaluationType] =
                (countByType[response.evaluationType] || 0) + 1;
        });
        const stats = {
            totalCount,
            countByType,
        };
        if (scores.length > 0) {
            stats.averageScore =
                scores.reduce((sum, score) => sum + score, 0) / scores.length;
            stats.maxScore = Math.max(...scores);
            stats.minScore = Math.min(...scores);
        }
        return stats;
    }
};
exports.EvaluationResponseService = EvaluationResponseService;
exports.EvaluationResponseService = EvaluationResponseService = EvaluationResponseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(evaluation_response_entity_1.EvaluationResponse)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], EvaluationResponseService);
//# sourceMappingURL=evaluation-response.service.js.map