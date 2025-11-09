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
var AddQuestionToPeerEvaluationHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddQuestionToPeerEvaluationHandler = exports.AddQuestionToPeerEvaluationCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const peer_evaluation_question_mapping_service_1 = require("../../../../../domain/core/peer-evaluation-question-mapping/peer-evaluation-question-mapping.service");
class AddQuestionToPeerEvaluationCommand {
    peerEvaluationId;
    questionId;
    displayOrder;
    questionGroupId;
    createdBy;
    constructor(peerEvaluationId, questionId, displayOrder, questionGroupId, createdBy) {
        this.peerEvaluationId = peerEvaluationId;
        this.questionId = questionId;
        this.displayOrder = displayOrder;
        this.questionGroupId = questionGroupId;
        this.createdBy = createdBy;
    }
}
exports.AddQuestionToPeerEvaluationCommand = AddQuestionToPeerEvaluationCommand;
let AddQuestionToPeerEvaluationHandler = AddQuestionToPeerEvaluationHandler_1 = class AddQuestionToPeerEvaluationHandler {
    peerEvaluationQuestionMappingService;
    logger = new common_1.Logger(AddQuestionToPeerEvaluationHandler_1.name);
    constructor(peerEvaluationQuestionMappingService) {
        this.peerEvaluationQuestionMappingService = peerEvaluationQuestionMappingService;
    }
    async execute(command) {
        this.logger.log(`동료평가에 질문 추가 - peerEvaluationId: ${command.peerEvaluationId}, questionId: ${command.questionId}`);
        try {
            const mapping = await this.peerEvaluationQuestionMappingService.생성한다({
                peerEvaluationId: command.peerEvaluationId,
                questionId: command.questionId,
                questionGroupId: command.questionGroupId,
                displayOrder: command.displayOrder,
            }, command.createdBy);
            this.logger.log(`동료평가에 질문 추가 완료 - mappingId: ${mapping.id}`);
            return mapping.id;
        }
        catch (error) {
            this.logger.error(`동료평가에 질문 추가 실패 - peerEvaluationId: ${command.peerEvaluationId}, questionId: ${command.questionId}`, error.stack);
            throw error;
        }
    }
};
exports.AddQuestionToPeerEvaluationHandler = AddQuestionToPeerEvaluationHandler;
exports.AddQuestionToPeerEvaluationHandler = AddQuestionToPeerEvaluationHandler = AddQuestionToPeerEvaluationHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(AddQuestionToPeerEvaluationCommand),
    __metadata("design:paramtypes", [peer_evaluation_question_mapping_service_1.PeerEvaluationQuestionMappingService])
], AddQuestionToPeerEvaluationHandler);
//# sourceMappingURL=add-question-to-peer-evaluation.handler.js.map