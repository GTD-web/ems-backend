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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationQuestionManagementService = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const question_group_1 = require("./handlers/question-group");
const evaluation_question_1 = require("./handlers/evaluation-question");
const question_group_mapping_1 = require("./handlers/question-group-mapping");
const evaluation_response_1 = require("./handlers/evaluation-response");
let EvaluationQuestionManagementService = class EvaluationQuestionManagementService {
    queryBus;
    commandBus;
    constructor(queryBus, commandBus) {
        this.queryBus = queryBus;
        this.commandBus = commandBus;
    }
    async 질문그룹을_생성한다(data, createdBy) {
        return await this.commandBus.execute(new question_group_1.CreateQuestionGroupCommand(data, createdBy));
    }
    async 질문그룹을_수정한다(id, data, updatedBy) {
        await this.commandBus.execute(new question_group_1.UpdateQuestionGroupCommand(id, data, updatedBy));
    }
    async 질문그룹을_삭제한다(id, deletedBy) {
        await this.commandBus.execute(new question_group_1.DeleteQuestionGroupCommand(id, deletedBy));
    }
    async 기본질문그룹을_설정한다(groupId, updatedBy) {
        await this.commandBus.execute(new question_group_1.SetDefaultQuestionGroupCommand(groupId, updatedBy));
    }
    async 질문그룹을_조회한다(id) {
        return await this.queryBus.execute(new question_group_1.GetQuestionGroupQuery(id));
    }
    async 질문그룹목록을_조회한다(filter) {
        return await this.queryBus.execute(new question_group_1.GetQuestionGroupsQuery(filter));
    }
    async 기본질문그룹을_조회한다() {
        return await this.queryBus.execute(new question_group_1.GetDefaultQuestionGroupQuery());
    }
    async 평가질문을_생성한다(data, createdBy) {
        return await this.commandBus.execute(new evaluation_question_1.CreateEvaluationQuestionCommand(data, createdBy));
    }
    async 평가질문을_수정한다(id, data, updatedBy) {
        await this.commandBus.execute(new evaluation_question_1.UpdateEvaluationQuestionCommand(id, data, updatedBy));
    }
    async 평가질문을_삭제한다(id, deletedBy) {
        await this.commandBus.execute(new evaluation_question_1.DeleteEvaluationQuestionCommand(id, deletedBy));
    }
    async 평가질문을_복사한다(id, copiedBy) {
        return await this.commandBus.execute(new evaluation_question_1.CopyEvaluationQuestionCommand(id, copiedBy));
    }
    async 평가질문을_조회한다(id) {
        return await this.queryBus.execute(new evaluation_question_1.GetEvaluationQuestionQuery(id));
    }
    async 평가질문목록을_조회한다(filter) {
        return await this.queryBus.execute(new evaluation_question_1.GetEvaluationQuestionsQuery(filter));
    }
    async 그룹에_질문을_추가한다(data, createdBy) {
        return await this.commandBus.execute(new question_group_mapping_1.AddQuestionToGroupCommand(data, createdBy));
    }
    async 그룹에서_질문을_제거한다(mappingId, deletedBy) {
        await this.commandBus.execute(new question_group_mapping_1.RemoveQuestionFromGroupCommand(mappingId, deletedBy));
    }
    async 질문표시순서를_변경한다(mappingId, displayOrder, updatedBy) {
        await this.commandBus.execute(new question_group_mapping_1.UpdateQuestionDisplayOrderCommand(mappingId, displayOrder, updatedBy));
    }
    async 질문순서를_위로_이동한다(mappingId, updatedBy) {
        await this.commandBus.execute(new question_group_mapping_1.MoveQuestionUpCommand(mappingId, updatedBy));
    }
    async 질문순서를_아래로_이동한다(mappingId, updatedBy) {
        await this.commandBus.execute(new question_group_mapping_1.MoveQuestionDownCommand(mappingId, updatedBy));
    }
    async 그룹에_여러_질문을_추가한다(groupId, questionIds, startDisplayOrder, createdBy) {
        return await this.commandBus.execute(new question_group_mapping_1.AddMultipleQuestionsToGroupCommand(groupId, questionIds, startDisplayOrder, createdBy));
    }
    async 그룹내_질문순서를_재정의한다(groupId, questionIds, updatedBy) {
        await this.commandBus.execute(new question_group_mapping_1.ReorderGroupQuestionsCommand(groupId, questionIds, updatedBy));
    }
    async 그룹의_질문목록을_조회한다(groupId) {
        return await this.queryBus.execute(new question_group_mapping_1.GetGroupQuestionsQuery(groupId));
    }
    async 질문이_속한_그룹목록을_조회한다(questionId) {
        return await this.queryBus.execute(new question_group_mapping_1.GetQuestionGroupsByQuestionQuery(questionId));
    }
    async 평가응답을_생성한다(data, createdBy) {
        return await this.commandBus.execute(new evaluation_response_1.CreateEvaluationResponseCommand(data, createdBy));
    }
    async 평가응답을_수정한다(id, data, updatedBy) {
        await this.commandBus.execute(new evaluation_response_1.UpdateEvaluationResponseCommand(id, data, updatedBy));
    }
    async 평가응답을_삭제한다(id, deletedBy) {
        await this.commandBus.execute(new evaluation_response_1.DeleteEvaluationResponseCommand(id, deletedBy));
    }
    async 평가응답목록을_조회한다(filter) {
        return await this.queryBus.execute(new evaluation_response_1.GetEvaluationResponsesQuery(filter));
    }
    async 평가응답통계를_조회한다(evaluationId) {
        return await this.queryBus.execute(new evaluation_response_1.GetEvaluationResponseStatsQuery(evaluationId));
    }
};
exports.EvaluationQuestionManagementService = EvaluationQuestionManagementService;
exports.EvaluationQuestionManagementService = EvaluationQuestionManagementService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cqrs_1.QueryBus,
        cqrs_1.CommandBus])
], EvaluationQuestionManagementService);
//# sourceMappingURL=evaluation-question-management.service.js.map