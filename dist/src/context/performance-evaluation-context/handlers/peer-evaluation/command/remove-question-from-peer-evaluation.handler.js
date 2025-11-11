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
var RemoveQuestionFromPeerEvaluationHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoveQuestionFromPeerEvaluationHandler = exports.RemoveQuestionFromPeerEvaluationCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const peer_evaluation_question_mapping_service_1 = require("../../../../../domain/core/peer-evaluation-question-mapping/peer-evaluation-question-mapping.service");
class RemoveQuestionFromPeerEvaluationCommand {
    mappingId;
    deletedBy;
    constructor(mappingId, deletedBy) {
        this.mappingId = mappingId;
        this.deletedBy = deletedBy;
    }
}
exports.RemoveQuestionFromPeerEvaluationCommand = RemoveQuestionFromPeerEvaluationCommand;
let RemoveQuestionFromPeerEvaluationHandler = RemoveQuestionFromPeerEvaluationHandler_1 = class RemoveQuestionFromPeerEvaluationHandler {
    peerEvaluationQuestionMappingService;
    logger = new common_1.Logger(RemoveQuestionFromPeerEvaluationHandler_1.name);
    constructor(peerEvaluationQuestionMappingService) {
        this.peerEvaluationQuestionMappingService = peerEvaluationQuestionMappingService;
    }
    async execute(command) {
        this.logger.log(`동료평가에서 질문 제거 - mappingId: ${command.mappingId}`);
        try {
            await this.peerEvaluationQuestionMappingService.삭제한다(command.mappingId, command.deletedBy);
            this.logger.log(`동료평가에서 질문 제거 완료 - mappingId: ${command.mappingId}`);
        }
        catch (error) {
            this.logger.error(`동료평가에서 질문 제거 실패 - mappingId: ${command.mappingId}`, error.stack);
            throw error;
        }
    }
};
exports.RemoveQuestionFromPeerEvaluationHandler = RemoveQuestionFromPeerEvaluationHandler;
exports.RemoveQuestionFromPeerEvaluationHandler = RemoveQuestionFromPeerEvaluationHandler = RemoveQuestionFromPeerEvaluationHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(RemoveQuestionFromPeerEvaluationCommand),
    __metadata("design:paramtypes", [peer_evaluation_question_mapping_service_1.PeerEvaluationQuestionMappingService])
], RemoveQuestionFromPeerEvaluationHandler);
//# sourceMappingURL=remove-question-from-peer-evaluation.handler.js.map