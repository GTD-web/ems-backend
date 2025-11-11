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
var QuestionGroupService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionGroupService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const question_group_entity_1 = require("./question-group.entity");
const question_group_exceptions_1 = require("./question-group.exceptions");
let QuestionGroupService = QuestionGroupService_1 = class QuestionGroupService {
    questionGroupRepository;
    logger = new common_1.Logger(QuestionGroupService_1.name);
    constructor(questionGroupRepository) {
        this.questionGroupRepository = questionGroupRepository;
    }
    async ID로조회한다(id) {
        this.logger.log(`질문 그룹 조회 - ID: ${id}`);
        return await this.questionGroupRepository.findOne({
            where: { id, deletedAt: (0, typeorm_2.IsNull)() },
        });
    }
    async 그룹명으로조회한다(name) {
        this.logger.log(`질문 그룹 조회 - 그룹명: ${name}`);
        return await this.questionGroupRepository.findOne({
            where: { name, deletedAt: (0, typeorm_2.IsNull)() },
        });
    }
    async 기본그룹조회한다() {
        this.logger.log('기본 그룹 조회');
        return await this.questionGroupRepository.findOne({
            where: { isDefault: true, deletedAt: (0, typeorm_2.IsNull)() },
        });
    }
    async 전체조회한다() {
        this.logger.log('전체 질문 그룹 조회');
        return await this.questionGroupRepository.find({
            where: { deletedAt: (0, typeorm_2.IsNull)() },
            order: { createdAt: 'ASC' },
        });
    }
    async 필터조회한다(filter) {
        this.logger.log('필터 조건으로 질문 그룹 조회', filter);
        const queryBuilder = this.questionGroupRepository
            .createQueryBuilder('group')
            .where('group.deletedAt IS NULL');
        if (filter.nameSearch) {
            queryBuilder.andWhere('group.name LIKE :nameSearch', {
                nameSearch: `%${filter.nameSearch}%`,
            });
        }
        if (filter.isDefault !== undefined) {
            queryBuilder.andWhere('group.isDefault = :isDefault', {
                isDefault: filter.isDefault,
            });
        }
        if (filter.isDeletable !== undefined) {
            queryBuilder.andWhere('group.isDeletable = :isDeletable', {
                isDeletable: filter.isDeletable,
            });
        }
        queryBuilder.orderBy('group.createdAt', 'ASC');
        return await queryBuilder.getMany();
    }
    async 삭제가능그룹조회한다() {
        this.logger.log('삭제 가능한 그룹 조회');
        return await this.questionGroupRepository.find({
            where: { isDeletable: true, deletedAt: (0, typeorm_2.IsNull)() },
            order: { createdAt: 'ASC' },
        });
    }
    async 생성한다(createDto, createdBy) {
        this.logger.log(`질문 그룹 생성 시작 - 그룹명: ${createDto.name}`);
        const exists = await this.그룹명중복확인한다(createDto.name);
        if (exists) {
            throw new question_group_exceptions_1.DuplicateQuestionGroupException(createDto.name);
        }
        try {
            const questionGroup = new question_group_entity_1.QuestionGroup({ ...createDto, createdBy });
            const saved = await this.questionGroupRepository.save(questionGroup);
            this.logger.log(`질문 그룹 생성 완료 - ID: ${saved.id}`);
            return saved;
        }
        catch (error) {
            this.logger.error(`질문 그룹 생성 실패 - 그룹명: ${createDto.name}`, error.stack);
            throw error;
        }
    }
    async 업데이트한다(id, updateDto, updatedBy) {
        this.logger.log(`질문 그룹 수정 시작 - ID: ${id}`);
        const questionGroup = await this.ID로조회한다(id);
        if (!questionGroup) {
            throw new question_group_exceptions_1.QuestionGroupNotFoundException(id);
        }
        if (updateDto.name && updateDto.name !== questionGroup.name) {
            const exists = await this.그룹명중복확인한다(updateDto.name, id);
            if (exists) {
                throw new question_group_exceptions_1.DuplicateQuestionGroupException(updateDto.name);
            }
        }
        try {
            if (updateDto.name !== undefined) {
                questionGroup.그룹명업데이트한다(updateDto.name, updatedBy);
            }
            if (updateDto.isDefault !== undefined) {
                if (updateDto.isDefault === true) {
                    const currentDefault = await this.기본그룹조회한다();
                    if (currentDefault && currentDefault.id !== id) {
                        currentDefault.기본그룹설정한다(false, updatedBy);
                        await this.questionGroupRepository.save(currentDefault);
                    }
                }
                questionGroup.기본그룹설정한다(updateDto.isDefault, updatedBy);
            }
            if (updateDto.isDeletable !== undefined) {
                questionGroup.삭제가능여부설정한다(updateDto.isDeletable, updatedBy);
            }
            const saved = await this.questionGroupRepository.save(questionGroup);
            this.logger.log(`질문 그룹 수정 완료 - ID: ${id}`);
            return saved;
        }
        catch (error) {
            this.logger.error(`질문 그룹 수정 실패 - ID: ${id}`, error.stack);
            throw error;
        }
    }
    async 삭제한다(id, deletedBy) {
        this.logger.log(`질문 그룹 삭제 시작 - ID: ${id}`);
        const questionGroup = await this.ID로조회한다(id);
        if (!questionGroup) {
            throw new question_group_exceptions_1.QuestionGroupNotFoundException(id);
        }
        if (questionGroup.기본그룹인가()) {
            throw new question_group_exceptions_1.DefaultGroupDeletionException(id);
        }
        if (!questionGroup.삭제가능한가()) {
            throw new question_group_exceptions_1.UndeletableGroupException(id);
        }
        try {
            questionGroup.deletedAt = new Date();
            questionGroup.메타데이터를_업데이트한다(deletedBy);
            await this.questionGroupRepository.save(questionGroup);
            this.logger.log(`질문 그룹 삭제 완료 - ID: ${id}`);
        }
        catch (error) {
            this.logger.error(`질문 그룹 삭제 실패 - ID: ${id}`, error.stack);
            throw error;
        }
    }
    async 그룹명중복확인한다(name, excludeId) {
        const queryBuilder = this.questionGroupRepository
            .createQueryBuilder('group')
            .where('group.name = :name', { name })
            .andWhere('group.deletedAt IS NULL');
        if (excludeId) {
            queryBuilder.andWhere('group.id != :excludeId', { excludeId });
        }
        const count = await queryBuilder.getCount();
        return count > 0;
    }
    async 그룹내질문존재확인한다(groupId) {
        return false;
    }
    async 그룹내질문개수조회한다(groupId) {
        return 0;
    }
    async 기본그룹설정한다(groupId, updatedBy) {
        this.logger.log(`기본 그룹 설정 - ID: ${groupId}`);
        const questionGroup = await this.ID로조회한다(groupId);
        if (!questionGroup) {
            throw new question_group_exceptions_1.QuestionGroupNotFoundException(groupId);
        }
        try {
            const currentDefault = await this.기본그룹조회한다();
            if (currentDefault && currentDefault.id !== groupId) {
                currentDefault.기본그룹설정한다(false, updatedBy);
                await this.questionGroupRepository.save(currentDefault);
            }
            questionGroup.기본그룹설정한다(true, updatedBy);
            await this.questionGroupRepository.save(questionGroup);
            this.logger.log(`기본 그룹 설정 완료 - ID: ${groupId}`);
        }
        catch (error) {
            this.logger.error(`기본 그룹 설정 실패 - ID: ${groupId}`, error.stack);
            throw error;
        }
    }
};
exports.QuestionGroupService = QuestionGroupService;
exports.QuestionGroupService = QuestionGroupService = QuestionGroupService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(question_group_entity_1.QuestionGroup)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], QuestionGroupService);
//# sourceMappingURL=question-group.service.js.map