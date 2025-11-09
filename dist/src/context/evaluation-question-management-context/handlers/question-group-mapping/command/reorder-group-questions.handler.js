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
var ReorderGroupQuestionsHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReorderGroupQuestionsHandler = exports.ReorderGroupQuestionsCommand = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const question_group_mapping_entity_1 = require("../../../../../domain/sub/question-group-mapping/question-group-mapping.entity");
class ReorderGroupQuestionsCommand {
    groupId;
    questionIds;
    updatedBy;
    constructor(groupId, questionIds, updatedBy) {
        this.groupId = groupId;
        this.questionIds = questionIds;
        this.updatedBy = updatedBy;
    }
}
exports.ReorderGroupQuestionsCommand = ReorderGroupQuestionsCommand;
let ReorderGroupQuestionsHandler = ReorderGroupQuestionsHandler_1 = class ReorderGroupQuestionsHandler {
    questionGroupMappingRepository;
    logger = new common_1.Logger(ReorderGroupQuestionsHandler_1.name);
    constructor(questionGroupMappingRepository) {
        this.questionGroupMappingRepository = questionGroupMappingRepository;
    }
    async execute(command) {
        this.logger.log('그룹 내 질문 순서 재정의 시작', command);
        const { groupId, questionIds, updatedBy } = command;
        const mappings = await this.questionGroupMappingRepository
            .createQueryBuilder('mapping')
            .where('mapping.groupId = :groupId', { groupId })
            .andWhere('mapping.deletedAt IS NULL')
            .getMany();
        if (mappings.length === 0) {
            throw new common_1.NotFoundException(`그룹에 질문이 없습니다. (groupId: ${groupId})`);
        }
        const mappingQuestionIds = mappings.map((m) => m.questionId);
        const invalidIds = questionIds.filter((id) => !mappingQuestionIds.includes(id));
        if (invalidIds.length > 0) {
            throw new common_1.BadRequestException(`그룹에 속하지 않은 질문이 포함되어 있습니다. (ids: ${invalidIds.join(', ')})`);
        }
        if (questionIds.length !== mappings.length) {
            throw new common_1.BadRequestException(`모든 질문의 ID를 제공해야 합니다. (제공: ${questionIds.length}, 필요: ${mappings.length})`);
        }
        const uniqueIds = new Set(questionIds);
        if (uniqueIds.size !== questionIds.length) {
            throw new common_1.BadRequestException('중복된 질문 ID가 포함되어 있습니다.');
        }
        const updatedMappings = [];
        for (let i = 0; i < questionIds.length; i++) {
            const questionId = questionIds[i];
            const mapping = mappings.find((m) => m.questionId === questionId);
            if (mapping) {
                mapping.표시순서변경한다(i, updatedBy);
                updatedMappings.push(mapping);
            }
        }
        await this.questionGroupMappingRepository.save(updatedMappings);
        this.logger.log(`그룹 내 질문 순서 재정의 완료 - 그룹 ID: ${groupId}, 질문 개수: ${questionIds.length}`);
    }
};
exports.ReorderGroupQuestionsHandler = ReorderGroupQuestionsHandler;
exports.ReorderGroupQuestionsHandler = ReorderGroupQuestionsHandler = ReorderGroupQuestionsHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(ReorderGroupQuestionsCommand),
    __param(0, (0, typeorm_1.InjectRepository)(question_group_mapping_entity_1.QuestionGroupMapping)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ReorderGroupQuestionsHandler);
//# sourceMappingURL=reorder-group-questions.handler.js.map