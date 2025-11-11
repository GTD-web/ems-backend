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
var SubmitPeerEvaluationHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmitPeerEvaluationHandler = exports.SubmitPeerEvaluationCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const peer_evaluation_service_1 = require("../../../../../domain/core/peer-evaluation/peer-evaluation.service");
const peer_evaluation_question_mapping_service_1 = require("../../../../../domain/core/peer-evaluation-question-mapping/peer-evaluation-question-mapping.service");
const transaction_manager_service_1 = require("../../../../../../libs/database/transaction-manager.service");
class SubmitPeerEvaluationCommand {
    evaluationId;
    submittedBy;
    constructor(evaluationId, submittedBy = '시스템') {
        this.evaluationId = evaluationId;
        this.submittedBy = submittedBy;
    }
}
exports.SubmitPeerEvaluationCommand = SubmitPeerEvaluationCommand;
let SubmitPeerEvaluationHandler = SubmitPeerEvaluationHandler_1 = class SubmitPeerEvaluationHandler {
    peerEvaluationService;
    peerEvaluationQuestionMappingService;
    transactionManager;
    logger = new common_1.Logger(SubmitPeerEvaluationHandler_1.name);
    constructor(peerEvaluationService, peerEvaluationQuestionMappingService, transactionManager) {
        this.peerEvaluationService = peerEvaluationService;
        this.peerEvaluationQuestionMappingService = peerEvaluationQuestionMappingService;
        this.transactionManager = transactionManager;
    }
    async execute(command) {
        const { evaluationId, submittedBy } = command;
        this.logger.log('동료평가 제출 핸들러 실행', { evaluationId });
        return await this.transactionManager.executeTransaction(async () => {
            const evaluation = await this.peerEvaluationService.조회한다(evaluationId);
            if (!evaluation) {
                throw new common_1.BadRequestException('존재하지 않는 동료평가입니다.');
            }
            if (evaluation.완료되었는가()) {
                throw new common_1.BadRequestException('이미 완료된 동료평가입니다.');
            }
            const mappedQuestions = await this.peerEvaluationQuestionMappingService.동료평가의_질문목록을_조회한다(evaluationId);
            this.logger.log(`매핑된 질문 수: ${mappedQuestions.length}`, {
                evaluationId,
            });
            if (mappedQuestions.length === 0) {
                throw new common_1.BadRequestException('제출할 질문이 없습니다. 평가 질문을 먼저 추가해주세요.');
            }
            const answeredQuestions = mappedQuestions.filter((mapping) => mapping.답변이_있는가());
            this.logger.log(`응답한 질문 수: ${answeredQuestions.length} / ${mappedQuestions.length}`, { evaluationId });
            const unansweredQuestions = mappedQuestions.filter((mapping) => !mapping.답변이_있는가());
            if (unansweredQuestions.length > 0) {
                const unansweredQuestionIds = unansweredQuestions
                    .map((q) => q.questionId)
                    .join(', ');
                this.logger.warn(`미응답 질문 발견 - 질문 ID: ${unansweredQuestionIds}`, { evaluationId });
                throw new common_1.BadRequestException(`모든 질문에 응답해야 제출할 수 있습니다. 미응답 질문: ${unansweredQuestions.length}개`);
            }
            await this.peerEvaluationService.수정한다(evaluationId, { isCompleted: true }, submittedBy);
            this.logger.log('동료평가 제출 완료 - 모든 질문 응답 확인됨', {
                evaluationId,
                mappedQuestions: mappedQuestions.length,
                answeredQuestions: answeredQuestions.length,
            });
        });
    }
};
exports.SubmitPeerEvaluationHandler = SubmitPeerEvaluationHandler;
exports.SubmitPeerEvaluationHandler = SubmitPeerEvaluationHandler = SubmitPeerEvaluationHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(SubmitPeerEvaluationCommand),
    __metadata("design:paramtypes", [peer_evaluation_service_1.PeerEvaluationService,
        peer_evaluation_question_mapping_service_1.PeerEvaluationQuestionMappingService,
        transaction_manager_service_1.TransactionManagerService])
], SubmitPeerEvaluationHandler);
//# sourceMappingURL=submit-peer-evaluation.handler.js.map