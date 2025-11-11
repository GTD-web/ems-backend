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
var AddQuestionGroupToPeerEvaluationHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddQuestionGroupToPeerEvaluationHandler = exports.AddQuestionGroupToPeerEvaluationCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const peer_evaluation_question_mapping_service_1 = require("../../../../../domain/core/peer-evaluation-question-mapping/peer-evaluation-question-mapping.service");
const question_group_mapping_service_1 = require("../../../../../domain/sub/question-group-mapping/question-group-mapping.service");
class AddQuestionGroupToPeerEvaluationCommand {
    peerEvaluationId;
    questionGroupId;
    startDisplayOrder;
    createdBy;
    constructor(peerEvaluationId, questionGroupId, startDisplayOrder, createdBy) {
        this.peerEvaluationId = peerEvaluationId;
        this.questionGroupId = questionGroupId;
        this.startDisplayOrder = startDisplayOrder;
        this.createdBy = createdBy;
    }
}
exports.AddQuestionGroupToPeerEvaluationCommand = AddQuestionGroupToPeerEvaluationCommand;
let AddQuestionGroupToPeerEvaluationHandler = AddQuestionGroupToPeerEvaluationHandler_1 = class AddQuestionGroupToPeerEvaluationHandler {
    peerEvaluationQuestionMappingService;
    questionGroupMappingService;
    logger = new common_1.Logger(AddQuestionGroupToPeerEvaluationHandler_1.name);
    constructor(peerEvaluationQuestionMappingService, questionGroupMappingService) {
        this.peerEvaluationQuestionMappingService = peerEvaluationQuestionMappingService;
        this.questionGroupMappingService = questionGroupMappingService;
    }
    async execute(command) {
        this.logger.log(`동료평가에 질문 그룹 추가 - peerEvaluationId: ${command.peerEvaluationId}, questionGroupId: ${command.questionGroupId}`);
        try {
            const questionMappings = await this.questionGroupMappingService.그룹ID로조회한다(command.questionGroupId);
            if (questionMappings.length === 0) {
                this.logger.warn(`질문 그룹에 질문이 없습니다 - questionGroupId: ${command.questionGroupId}`);
                return [];
            }
            const questionIds = questionMappings.map((m) => m.questionId);
            const savedMappings = await this.peerEvaluationQuestionMappingService.질문그룹의_질문들을_일괄추가한다(command.peerEvaluationId, command.questionGroupId, questionIds, command.startDisplayOrder, command.createdBy);
            const mappingIds = savedMappings.map((m) => m.id);
            this.logger.log(`동료평가에 질문 그룹 추가 완료 - 추가된 질문 수: ${mappingIds.length}`);
            return mappingIds;
        }
        catch (error) {
            this.logger.error(`동료평가에 질문 그룹 추가 실패 - peerEvaluationId: ${command.peerEvaluationId}`, error.stack);
            throw error;
        }
    }
};
exports.AddQuestionGroupToPeerEvaluationHandler = AddQuestionGroupToPeerEvaluationHandler;
exports.AddQuestionGroupToPeerEvaluationHandler = AddQuestionGroupToPeerEvaluationHandler = AddQuestionGroupToPeerEvaluationHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(AddQuestionGroupToPeerEvaluationCommand),
    __metadata("design:paramtypes", [peer_evaluation_question_mapping_service_1.PeerEvaluationQuestionMappingService,
        question_group_mapping_service_1.QuestionGroupMappingService])
], AddQuestionGroupToPeerEvaluationHandler);
//# sourceMappingURL=add-question-group-to-peer-evaluation.handler.js.map