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
var QuestionGroupMappingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionGroupMappingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const question_group_mapping_entity_1 = require("./question-group-mapping.entity");
const question_group_mapping_exceptions_1 = require("./question-group-mapping.exceptions");
let QuestionGroupMappingService = QuestionGroupMappingService_1 = class QuestionGroupMappingService {
    mappingRepository;
    logger = new common_1.Logger(QuestionGroupMappingService_1.name);
    constructor(mappingRepository) {
        this.mappingRepository = mappingRepository;
    }
    async ID로조회한다(id) {
        this.logger.log(`질문 그룹 매핑 조회 - ID: ${id}`);
        return await this.mappingRepository.findOne({
            where: { id, deletedAt: (0, typeorm_2.IsNull)() },
        });
    }
    async 그룹ID로조회한다(groupId) {
        this.logger.log(`질문 그룹 매핑 조회 - 그룹 ID: ${groupId}`);
        return await this.mappingRepository
            .createQueryBuilder('mapping')
            .leftJoinAndSelect('mapping.question', 'question')
            .where('mapping.groupId = :groupId', { groupId })
            .andWhere('mapping.deletedAt IS NULL')
            .andWhere('question.deletedAt IS NULL')
            .orderBy('mapping.displayOrder', 'ASC')
            .getMany();
    }
    async 질문ID로조회한다(questionId) {
        this.logger.log(`질문 그룹 매핑 조회 - 질문 ID: ${questionId}`);
        return await this.mappingRepository
            .createQueryBuilder('mapping')
            .leftJoinAndSelect('mapping.group', 'group')
            .where('mapping.questionId = :questionId', { questionId })
            .andWhere('mapping.deletedAt IS NULL')
            .andWhere('group.deletedAt IS NULL')
            .orderBy('mapping.displayOrder', 'ASC')
            .getMany();
    }
    async 그룹질문으로조회한다(groupId, questionId) {
        this.logger.log(`질문 그룹 매핑 조회 - 그룹 ID: ${groupId}, 질문 ID: ${questionId}`);
        return await this.mappingRepository.findOne({
            where: { groupId, questionId, deletedAt: (0, typeorm_2.IsNull)() },
        });
    }
    async 필터조회한다(filter) {
        this.logger.log('필터 조건으로 질문 그룹 매핑 조회', filter);
        const queryBuilder = this.mappingRepository
            .createQueryBuilder('mapping')
            .where('mapping.deletedAt IS NULL');
        if (filter.groupId) {
            queryBuilder.andWhere('mapping.groupId = :groupId', {
                groupId: filter.groupId,
            });
        }
        if (filter.questionId) {
            queryBuilder.andWhere('mapping.questionId = :questionId', {
                questionId: filter.questionId,
            });
        }
        queryBuilder.orderBy('mapping.displayOrder', 'ASC');
        return await queryBuilder.getMany();
    }
    async 생성한다(createDto, createdBy) {
        this.logger.log(`질문 그룹 매핑 생성 시작 - 그룹 ID: ${createDto.groupId}, 질문 ID: ${createDto.questionId}`);
        const exists = await this.매핑중복확인한다(createDto.groupId, createDto.questionId);
        if (exists) {
            throw new question_group_mapping_exceptions_1.DuplicateQuestionGroupMappingException(createDto.groupId, createDto.questionId);
        }
        try {
            const mapping = new question_group_mapping_entity_1.QuestionGroupMapping({ ...createDto, createdBy });
            const saved = await this.mappingRepository.save(mapping);
            this.logger.log(`질문 그룹 매핑 생성 완료 - ID: ${saved.id}`);
            return saved;
        }
        catch (error) {
            this.logger.error(`질문 그룹 매핑 생성 실패 - 그룹 ID: ${createDto.groupId}, 질문 ID: ${createDto.questionId}`, error.stack);
            throw error;
        }
    }
    async 업데이트한다(id, updateDto, updatedBy) {
        this.logger.log(`질문 그룹 매핑 수정 시작 - ID: ${id}`);
        const mapping = await this.ID로조회한다(id);
        if (!mapping) {
            throw new question_group_mapping_exceptions_1.QuestionGroupMappingNotFoundException(id);
        }
        try {
            if (updateDto.displayOrder !== undefined) {
                mapping.표시순서변경한다(updateDto.displayOrder, updatedBy);
            }
            const saved = await this.mappingRepository.save(mapping);
            this.logger.log(`질문 그룹 매핑 수정 완료 - ID: ${id}`);
            return saved;
        }
        catch (error) {
            this.logger.error(`질문 그룹 매핑 수정 실패 - ID: ${id}`, error.stack);
            throw error;
        }
    }
    async 삭제한다(id, deletedBy) {
        this.logger.log(`질문 그룹 매핑 삭제 시작 - ID: ${id}`);
        const mapping = await this.ID로조회한다(id);
        if (!mapping) {
            throw new question_group_mapping_exceptions_1.QuestionGroupMappingNotFoundException(id);
        }
        try {
            mapping.deletedAt = new Date();
            mapping.메타데이터를_업데이트한다(deletedBy);
            await this.mappingRepository.save(mapping);
            this.logger.log(`질문 그룹 매핑 삭제 완료 - ID: ${id}`);
        }
        catch (error) {
            this.logger.error(`질문 그룹 매핑 삭제 실패 - ID: ${id}`, error.stack);
            throw error;
        }
    }
    async 그룹매핑전체삭제한다(groupId, deletedBy) {
        this.logger.log(`그룹의 모든 매핑 삭제 시작 - 그룹 ID: ${groupId}`);
        const mappings = await this.그룹ID로조회한다(groupId);
        try {
            for (const mapping of mappings) {
                mapping.deletedAt = new Date();
                mapping.메타데이터를_업데이트한다(deletedBy);
            }
            await this.mappingRepository.save(mappings);
            this.logger.log(`그룹의 모든 매핑 삭제 완료 - 그룹 ID: ${groupId}, 삭제 개수: ${mappings.length}`);
        }
        catch (error) {
            this.logger.error(`그룹의 모든 매핑 삭제 실패 - 그룹 ID: ${groupId}`, error.stack);
            throw error;
        }
    }
    async 질문매핑전체삭제한다(questionId, deletedBy) {
        this.logger.log(`질문의 모든 매핑 삭제 시작 - 질문 ID: ${questionId}`);
        const mappings = await this.질문ID로조회한다(questionId);
        try {
            for (const mapping of mappings) {
                mapping.deletedAt = new Date();
                mapping.메타데이터를_업데이트한다(deletedBy);
            }
            await this.mappingRepository.save(mappings);
            this.logger.log(`질문의 모든 매핑 삭제 완료 - 질문 ID: ${questionId}, 삭제 개수: ${mappings.length}`);
        }
        catch (error) {
            this.logger.error(`질문의 모든 매핑 삭제 실패 - 질문 ID: ${questionId}`, error.stack);
            throw error;
        }
    }
    async 매핑중복확인한다(groupId, questionId) {
        const count = await this.mappingRepository.count({
            where: { groupId, questionId, deletedAt: (0, typeorm_2.IsNull)() },
        });
        return count > 0;
    }
    async 그룹내질문개수조회한다(groupId) {
        return await this.mappingRepository.count({
            where: { groupId, deletedAt: (0, typeorm_2.IsNull)() },
        });
    }
    async 질문의그룹개수조회한다(questionId) {
        return await this.mappingRepository.count({
            where: { questionId, deletedAt: (0, typeorm_2.IsNull)() },
        });
    }
};
exports.QuestionGroupMappingService = QuestionGroupMappingService;
exports.QuestionGroupMappingService = QuestionGroupMappingService = QuestionGroupMappingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(question_group_mapping_entity_1.QuestionGroupMapping)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], QuestionGroupMappingService);
//# sourceMappingURL=question-group-mapping.service.js.map