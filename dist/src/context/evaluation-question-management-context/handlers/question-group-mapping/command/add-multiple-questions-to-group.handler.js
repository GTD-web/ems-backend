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
var AddMultipleQuestionsToGroupHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddMultipleQuestionsToGroupHandler = exports.AddMultipleQuestionsToGroupCommand = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const question_group_mapping_service_1 = require("../../../../../domain/sub/question-group-mapping/question-group-mapping.service");
const question_group_entity_1 = require("../../../../../domain/sub/question-group/question-group.entity");
const evaluation_question_entity_1 = require("../../../../../domain/sub/evaluation-question/evaluation-question.entity");
class AddMultipleQuestionsToGroupCommand {
    groupId;
    questionIds;
    startDisplayOrder;
    createdBy;
    constructor(groupId, questionIds, startDisplayOrder, createdBy) {
        this.groupId = groupId;
        this.questionIds = questionIds;
        this.startDisplayOrder = startDisplayOrder;
        this.createdBy = createdBy;
    }
}
exports.AddMultipleQuestionsToGroupCommand = AddMultipleQuestionsToGroupCommand;
let AddMultipleQuestionsToGroupHandler = AddMultipleQuestionsToGroupHandler_1 = class AddMultipleQuestionsToGroupHandler {
    questionGroupMappingService;
    questionGroupRepository;
    evaluationQuestionRepository;
    logger = new common_1.Logger(AddMultipleQuestionsToGroupHandler_1.name);
    constructor(questionGroupMappingService, questionGroupRepository, evaluationQuestionRepository) {
        this.questionGroupMappingService = questionGroupMappingService;
        this.questionGroupRepository = questionGroupRepository;
        this.evaluationQuestionRepository = evaluationQuestionRepository;
    }
    async execute(command) {
        this.logger.log('여러 질문을 그룹에 추가 시작', command);
        const { groupId, questionIds, startDisplayOrder, createdBy } = command;
        const group = await this.questionGroupRepository
            .createQueryBuilder('group')
            .where('group.id = :groupId', { groupId })
            .andWhere('group.deletedAt IS NULL')
            .getOne();
        if (!group) {
            throw new common_1.NotFoundException(`질문 그룹을 찾을 수 없습니다. (id: ${groupId})`);
        }
        const questions = await this.evaluationQuestionRepository
            .createQueryBuilder('question')
            .where('question.id IN (:...questionIds)', { questionIds })
            .andWhere('question.deletedAt IS NULL')
            .getMany();
        if (questions.length !== questionIds.length) {
            const foundIds = questions.map((q) => q.id);
            const missingIds = questionIds.filter((id) => !foundIds.includes(id));
            throw new common_1.NotFoundException(`일부 질문을 찾을 수 없습니다. (ids: ${missingIds.join(', ')})`);
        }
        const createdMappingIds = [];
        let currentDisplayOrder = startDisplayOrder;
        for (const questionId of questionIds) {
            try {
                const existingMapping = await this.questionGroupMappingService.그룹질문으로조회한다(groupId, questionId);
                if (existingMapping) {
                    this.logger.warn(`이미 그룹에 추가된 질문 건너뜀 - 질문 ID: ${questionId}`);
                    continue;
                }
                const mapping = await this.questionGroupMappingService.생성한다({
                    groupId,
                    questionId,
                    displayOrder: currentDisplayOrder,
                }, createdBy);
                createdMappingIds.push(mapping.id);
                currentDisplayOrder++;
                this.logger.log(`질문이 그룹에 추가됨 - 질문 ID: ${questionId}, 매핑 ID: ${mapping.id}`);
            }
            catch (error) {
                this.logger.error(`질문 추가 실패 - 질문 ID: ${questionId}`, error.message);
            }
        }
        this.logger.log(`여러 질문을 그룹에 추가 완료 - 그룹 ID: ${groupId}, 추가된 개수: ${createdMappingIds.length}/${questionIds.length}`);
        return createdMappingIds;
    }
};
exports.AddMultipleQuestionsToGroupHandler = AddMultipleQuestionsToGroupHandler;
exports.AddMultipleQuestionsToGroupHandler = AddMultipleQuestionsToGroupHandler = AddMultipleQuestionsToGroupHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(AddMultipleQuestionsToGroupCommand),
    __param(1, (0, typeorm_1.InjectRepository)(question_group_entity_1.QuestionGroup)),
    __param(2, (0, typeorm_1.InjectRepository)(evaluation_question_entity_1.EvaluationQuestion)),
    __metadata("design:paramtypes", [question_group_mapping_service_1.QuestionGroupMappingService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AddMultipleQuestionsToGroupHandler);
//# sourceMappingURL=add-multiple-questions-to-group.handler.js.map