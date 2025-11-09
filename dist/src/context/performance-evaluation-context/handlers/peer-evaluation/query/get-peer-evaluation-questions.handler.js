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
var GetPeerEvaluationQuestionsHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPeerEvaluationQuestionsHandler = exports.GetPeerEvaluationQuestionsQuery = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const peer_evaluation_question_mapping_service_1 = require("../../../../../domain/core/peer-evaluation-question-mapping/peer-evaluation-question-mapping.service");
const evaluation_question_service_1 = require("../../../../../domain/sub/evaluation-question/evaluation-question.service");
class GetPeerEvaluationQuestionsQuery {
    peerEvaluationId;
    constructor(peerEvaluationId) {
        this.peerEvaluationId = peerEvaluationId;
    }
}
exports.GetPeerEvaluationQuestionsQuery = GetPeerEvaluationQuestionsQuery;
let GetPeerEvaluationQuestionsHandler = GetPeerEvaluationQuestionsHandler_1 = class GetPeerEvaluationQuestionsHandler {
    peerEvaluationQuestionMappingService;
    evaluationQuestionService;
    logger = new common_1.Logger(GetPeerEvaluationQuestionsHandler_1.name);
    constructor(peerEvaluationQuestionMappingService, evaluationQuestionService) {
        this.peerEvaluationQuestionMappingService = peerEvaluationQuestionMappingService;
        this.evaluationQuestionService = evaluationQuestionService;
    }
    async execute(query) {
        this.logger.log(`동료평가 질문 목록 조회 - peerEvaluationId: ${query.peerEvaluationId}`);
        try {
            const mappings = await this.peerEvaluationQuestionMappingService.동료평가의_질문목록을_조회한다(query.peerEvaluationId);
            if (mappings.length === 0) {
                this.logger.log('동료평가에 할당된 질문이 없습니다.');
                return [];
            }
            const result = [];
            for (const mapping of mappings) {
                const question = await this.evaluationQuestionService.ID로조회한다(mapping.questionId);
                if (question) {
                    result.push({
                        mappingId: mapping.id,
                        questionId: question.id,
                        questionText: question.text,
                        questionGroupId: mapping.questionGroupId,
                        displayOrder: mapping.displayOrder,
                        createdAt: mapping.createdAt,
                    });
                }
            }
            this.logger.log(`동료평가 질문 목록 조회 완료 - 질문 수: ${result.length}`);
            return result;
        }
        catch (error) {
            this.logger.error(`동료평가 질문 목록 조회 실패 - peerEvaluationId: ${query.peerEvaluationId}`, error.stack);
            throw error;
        }
    }
};
exports.GetPeerEvaluationQuestionsHandler = GetPeerEvaluationQuestionsHandler;
exports.GetPeerEvaluationQuestionsHandler = GetPeerEvaluationQuestionsHandler = GetPeerEvaluationQuestionsHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(GetPeerEvaluationQuestionsQuery),
    __metadata("design:paramtypes", [peer_evaluation_question_mapping_service_1.PeerEvaluationQuestionMappingService,
        evaluation_question_service_1.EvaluationQuestionService])
], GetPeerEvaluationQuestionsHandler);
//# sourceMappingURL=get-peer-evaluation-questions.handler.js.map