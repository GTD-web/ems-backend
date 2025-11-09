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
var UpdatePeerEvaluationQuestionOrderHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePeerEvaluationQuestionOrderHandler = exports.UpdatePeerEvaluationQuestionOrderCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const peer_evaluation_question_mapping_service_1 = require("../../../../../domain/core/peer-evaluation-question-mapping/peer-evaluation-question-mapping.service");
class UpdatePeerEvaluationQuestionOrderCommand {
    mappingId;
    newDisplayOrder;
    updatedBy;
    constructor(mappingId, newDisplayOrder, updatedBy) {
        this.mappingId = mappingId;
        this.newDisplayOrder = newDisplayOrder;
        this.updatedBy = updatedBy;
    }
}
exports.UpdatePeerEvaluationQuestionOrderCommand = UpdatePeerEvaluationQuestionOrderCommand;
let UpdatePeerEvaluationQuestionOrderHandler = UpdatePeerEvaluationQuestionOrderHandler_1 = class UpdatePeerEvaluationQuestionOrderHandler {
    peerEvaluationQuestionMappingService;
    logger = new common_1.Logger(UpdatePeerEvaluationQuestionOrderHandler_1.name);
    constructor(peerEvaluationQuestionMappingService) {
        this.peerEvaluationQuestionMappingService = peerEvaluationQuestionMappingService;
    }
    async execute(command) {
        this.logger.log(`동료평가 질문 순서 변경 - mappingId: ${command.mappingId}, newOrder: ${command.newDisplayOrder}`);
        try {
            await this.peerEvaluationQuestionMappingService.업데이트한다(command.mappingId, { displayOrder: command.newDisplayOrder }, command.updatedBy);
            this.logger.log(`동료평가 질문 순서 변경 완료 - mappingId: ${command.mappingId}`);
        }
        catch (error) {
            this.logger.error(`동료평가 질문 순서 변경 실패 - mappingId: ${command.mappingId}`, error.stack);
            throw error;
        }
    }
};
exports.UpdatePeerEvaluationQuestionOrderHandler = UpdatePeerEvaluationQuestionOrderHandler;
exports.UpdatePeerEvaluationQuestionOrderHandler = UpdatePeerEvaluationQuestionOrderHandler = UpdatePeerEvaluationQuestionOrderHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(UpdatePeerEvaluationQuestionOrderCommand),
    __metadata("design:paramtypes", [peer_evaluation_question_mapping_service_1.PeerEvaluationQuestionMappingService])
], UpdatePeerEvaluationQuestionOrderHandler);
//# sourceMappingURL=update-peer-evaluation-question-order.handler.js.map