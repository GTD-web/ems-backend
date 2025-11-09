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
var AddMultipleQuestionsToPeerEvaluationHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddMultipleQuestionsToPeerEvaluationHandler = exports.AddMultipleQuestionsToPeerEvaluationCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const peer_evaluation_question_mapping_service_1 = require("../../../../../domain/core/peer-evaluation-question-mapping/peer-evaluation-question-mapping.service");
class AddMultipleQuestionsToPeerEvaluationCommand {
    peerEvaluationId;
    questionIds;
    startDisplayOrder;
    createdBy;
    constructor(peerEvaluationId, questionIds, startDisplayOrder, createdBy) {
        this.peerEvaluationId = peerEvaluationId;
        this.questionIds = questionIds;
        this.startDisplayOrder = startDisplayOrder;
        this.createdBy = createdBy;
    }
}
exports.AddMultipleQuestionsToPeerEvaluationCommand = AddMultipleQuestionsToPeerEvaluationCommand;
let AddMultipleQuestionsToPeerEvaluationHandler = AddMultipleQuestionsToPeerEvaluationHandler_1 = class AddMultipleQuestionsToPeerEvaluationHandler {
    peerEvaluationQuestionMappingService;
    logger = new common_1.Logger(AddMultipleQuestionsToPeerEvaluationHandler_1.name);
    constructor(peerEvaluationQuestionMappingService) {
        this.peerEvaluationQuestionMappingService = peerEvaluationQuestionMappingService;
    }
    async execute(command) {
        this.logger.log(`동료평가에 여러 질문 일괄 추가 - peerEvaluationId: ${command.peerEvaluationId}, 질문 수: ${command.questionIds.length}`);
        const mappingIds = [];
        for (let i = 0; i < command.questionIds.length; i++) {
            const questionId = command.questionIds[i];
            try {
                const exists = await this.peerEvaluationQuestionMappingService.매핑중복확인한다(command.peerEvaluationId, questionId);
                if (exists) {
                    this.logger.warn(`이미 추가된 질문 건너뛰기 - questionId: ${questionId}`);
                    continue;
                }
                const mapping = await this.peerEvaluationQuestionMappingService.생성한다({
                    peerEvaluationId: command.peerEvaluationId,
                    questionId,
                    displayOrder: command.startDisplayOrder + i,
                    questionGroupId: undefined,
                }, command.createdBy);
                mappingIds.push(mapping.id);
            }
            catch (error) {
                this.logger.error(`질문 매핑 실패 - questionId: ${questionId}`, error.stack);
            }
        }
        this.logger.log(`동료평가에 여러 질문 일괄 추가 완료 - 성공: ${mappingIds.length}/${command.questionIds.length}`);
        return mappingIds;
    }
};
exports.AddMultipleQuestionsToPeerEvaluationHandler = AddMultipleQuestionsToPeerEvaluationHandler;
exports.AddMultipleQuestionsToPeerEvaluationHandler = AddMultipleQuestionsToPeerEvaluationHandler = AddMultipleQuestionsToPeerEvaluationHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(AddMultipleQuestionsToPeerEvaluationCommand),
    __metadata("design:paramtypes", [peer_evaluation_question_mapping_service_1.PeerEvaluationQuestionMappingService])
], AddMultipleQuestionsToPeerEvaluationHandler);
//# sourceMappingURL=add-multiple-questions-to-peer-evaluation.handler.js.map