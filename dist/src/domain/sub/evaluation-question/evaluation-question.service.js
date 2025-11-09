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
var EvaluationQuestionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationQuestionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_question_entity_1 = require("./evaluation-question.entity");
const evaluation_question_exceptions_1 = require("./evaluation-question.exceptions");
let EvaluationQuestionService = EvaluationQuestionService_1 = class EvaluationQuestionService {
    evaluationQuestionRepository;
    logger = new common_1.Logger(EvaluationQuestionService_1.name);
    constructor(evaluationQuestionRepository) {
        this.evaluationQuestionRepository = evaluationQuestionRepository;
    }
    async ID로조회한다(id) {
        this.logger.log(`평가 질문 조회 - ID: ${id}`);
        return await this.evaluationQuestionRepository.findOne({
            where: { id, deletedAt: (0, typeorm_2.IsNull)() },
        });
    }
    async 질문내용으로조회한다(text) {
        this.logger.log(`평가 질문 조회 - 질문 내용: ${text}`);
        return await this.evaluationQuestionRepository.findOne({
            where: { text, deletedAt: (0, typeorm_2.IsNull)() },
        });
    }
    async 전체조회한다() {
        this.logger.log('전체 평가 질문 조회');
        return await this.evaluationQuestionRepository.find({
            where: { deletedAt: (0, typeorm_2.IsNull)() },
            order: { createdAt: 'ASC' },
        });
    }
    async 필터조회한다(filter) {
        this.logger.log('필터 조건으로 평가 질문 조회', filter);
        const queryBuilder = this.evaluationQuestionRepository
            .createQueryBuilder('question')
            .where('question.deletedAt IS NULL');
        if (filter.textSearch) {
            queryBuilder.andWhere('question.text LIKE :textSearch', {
                textSearch: `%${filter.textSearch}%`,
            });
        }
        queryBuilder.orderBy('question.createdAt', 'ASC');
        return await queryBuilder.getMany();
    }
    async 생성한다(createDto, createdBy) {
        this.logger.log(`평가 질문 생성 시작 - 질문 내용: ${createDto.text}`);
        try {
            const evaluationQuestion = new evaluation_question_entity_1.EvaluationQuestion({
                ...createDto,
                createdBy,
            });
            const saved = await this.evaluationQuestionRepository.save(evaluationQuestion);
            this.logger.log(`평가 질문 생성 완료 - ID: ${saved.id}`);
            return saved;
        }
        catch (error) {
            this.logger.error(`평가 질문 생성 실패 - 질문 내용: ${createDto.text}`, error.stack);
            throw error;
        }
    }
    async 업데이트한다(id, updateDto, updatedBy) {
        this.logger.log(`평가 질문 수정 시작 - ID: ${id}`);
        const evaluationQuestion = await this.ID로조회한다(id);
        if (!evaluationQuestion) {
            throw new evaluation_question_exceptions_1.EvaluationQuestionNotFoundException(id);
        }
        if (updateDto.text && updateDto.text !== evaluationQuestion.text) {
            const exists = await this.질문내용중복확인한다(updateDto.text, id);
            if (exists) {
                throw new evaluation_question_exceptions_1.DuplicateEvaluationQuestionException(updateDto.text);
            }
        }
        try {
            if (updateDto.text !== undefined) {
                evaluationQuestion.질문내용업데이트한다(updateDto.text, updatedBy);
            }
            if (updateDto.minScore !== undefined ||
                updateDto.maxScore !== undefined) {
                evaluationQuestion.점수범위설정한다(updateDto.minScore !== undefined
                    ? updateDto.minScore
                    : evaluationQuestion.minScore, updateDto.maxScore !== undefined
                    ? updateDto.maxScore
                    : evaluationQuestion.maxScore, updatedBy);
            }
            const saved = await this.evaluationQuestionRepository.save(evaluationQuestion);
            this.logger.log(`평가 질문 수정 완료 - ID: ${id}`);
            return saved;
        }
        catch (error) {
            this.logger.error(`평가 질문 수정 실패 - ID: ${id}`, error.stack);
            throw error;
        }
    }
    async 삭제한다(id, deletedBy) {
        this.logger.log(`평가 질문 삭제 시작 - ID: ${id}`);
        const evaluationQuestion = await this.ID로조회한다(id);
        if (!evaluationQuestion) {
            throw new evaluation_question_exceptions_1.EvaluationQuestionNotFoundException(id);
        }
        const hasResponses = await this.질문응답존재확인한다(id);
        if (hasResponses) {
            const responseCount = await this.질문응답개수조회한다(id);
            throw new evaluation_question_exceptions_1.QuestionWithResponsesException(id, responseCount);
        }
        try {
            evaluationQuestion.deletedAt = new Date();
            evaluationQuestion.메타데이터를_업데이트한다(deletedBy);
            await this.evaluationQuestionRepository.save(evaluationQuestion);
            this.logger.log(`평가 질문 삭제 완료 - ID: ${id}`);
        }
        catch (error) {
            this.logger.error(`평가 질문 삭제 실패 - ID: ${id}`, error.stack);
            throw error;
        }
    }
    async 복사한다(id, copiedBy) {
        this.logger.log(`평가 질문 복사 시작 - ID: ${id}`);
        const evaluationQuestion = await this.ID로조회한다(id);
        if (!evaluationQuestion) {
            throw new evaluation_question_exceptions_1.EvaluationQuestionNotFoundException(id);
        }
        try {
            const newQuestion = new evaluation_question_entity_1.EvaluationQuestion({
                text: `${evaluationQuestion.text} (복사본)`,
                minScore: evaluationQuestion.minScore,
                maxScore: evaluationQuestion.maxScore,
                createdBy: copiedBy,
            });
            const saved = await this.evaluationQuestionRepository.save(newQuestion);
            this.logger.log(`평가 질문 복사 완료 - 새 ID: ${saved.id}`);
            return saved;
        }
        catch (error) {
            this.logger.error(`평가 질문 복사 실패 - ID: ${id}`, error.stack);
            throw error;
        }
    }
    async 질문내용중복확인한다(text, excludeId) {
        const queryBuilder = this.evaluationQuestionRepository
            .createQueryBuilder('question')
            .where('question.text = :text', { text })
            .andWhere('question.deletedAt IS NULL');
        if (excludeId) {
            queryBuilder.andWhere('question.id != :excludeId', { excludeId });
        }
        const count = await queryBuilder.getCount();
        return count > 0;
    }
    async 질문응답존재확인한다(questionId) {
        return false;
    }
    async 질문응답개수조회한다(questionId) {
        return 0;
    }
};
exports.EvaluationQuestionService = EvaluationQuestionService;
exports.EvaluationQuestionService = EvaluationQuestionService = EvaluationQuestionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(evaluation_question_entity_1.EvaluationQuestion)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], EvaluationQuestionService);
//# sourceMappingURL=evaluation-question.service.js.map