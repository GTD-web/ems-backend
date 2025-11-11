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
var UpsertPeerEvaluationAnswersHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpsertPeerEvaluationAnswersHandler = exports.UpsertPeerEvaluationAnswersCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const peer_evaluation_question_mapping_service_1 = require("../../../../../domain/core/peer-evaluation-question-mapping/peer-evaluation-question-mapping.service");
const peer_evaluation_service_1 = require("../../../../../domain/core/peer-evaluation/peer-evaluation.service");
const peer_evaluation_entity_1 = require("../../../../../domain/core/peer-evaluation/peer-evaluation.entity");
const class_validator_1 = require("class-validator");
class UpsertPeerEvaluationAnswersCommand {
    peerEvaluationId;
    answers;
    answeredBy;
    constructor(peerEvaluationId, answers, answeredBy) {
        this.peerEvaluationId = peerEvaluationId;
        this.answers = answers;
        this.answeredBy = answeredBy;
    }
}
exports.UpsertPeerEvaluationAnswersCommand = UpsertPeerEvaluationAnswersCommand;
let UpsertPeerEvaluationAnswersHandler = UpsertPeerEvaluationAnswersHandler_1 = class UpsertPeerEvaluationAnswersHandler {
    peerEvaluationService;
    peerEvaluationQuestionMappingService;
    peerEvaluationRepository;
    logger = new common_1.Logger(UpsertPeerEvaluationAnswersHandler_1.name);
    constructor(peerEvaluationService, peerEvaluationQuestionMappingService, peerEvaluationRepository) {
        this.peerEvaluationService = peerEvaluationService;
        this.peerEvaluationQuestionMappingService = peerEvaluationQuestionMappingService;
        this.peerEvaluationRepository = peerEvaluationRepository;
    }
    async execute(command) {
        this.logger.log(`동료평가 답변 저장 시작 - peerEvaluationId: ${command.peerEvaluationId}, 답변 개수: ${command.answers.length}`);
        try {
            const peerEvaluation = await this.peerEvaluationService.조회한다(command.peerEvaluationId);
            if (!peerEvaluation) {
                throw new common_1.NotFoundException(`동료평가를 찾을 수 없습니다. (id: ${command.peerEvaluationId})`);
            }
            if (peerEvaluation.status === 'cancelled') {
                throw new common_1.NotFoundException(`취소된 동료평가입니다. (id: ${command.peerEvaluationId})`);
            }
            let savedCount = 0;
            for (const answerItem of command.answers) {
                if (!(0, class_validator_1.isUUID)(answerItem.questionId)) {
                    throw new common_1.BadRequestException(`잘못된 UUID 형식의 questionId입니다: ${answerItem.questionId}`);
                }
                const mapping = await this.peerEvaluationQuestionMappingService.동료평가와_질문으로_조회한다(command.peerEvaluationId, answerItem.questionId);
                if (!mapping) {
                    this.logger.warn(`질문 매핑을 찾을 수 없습니다. - peerEvaluationId: ${command.peerEvaluationId}, questionId: ${answerItem.questionId}`);
                    continue;
                }
                mapping.답변을_저장한다(answerItem.answer, command.answeredBy, answerItem.score);
                await this.peerEvaluationQuestionMappingService.저장한다(mapping);
                savedCount++;
            }
            if (!peerEvaluation.완료되었는가() && peerEvaluation.대기중인가()) {
                peerEvaluation.진행중으로_변경한다(command.answeredBy);
                await this.peerEvaluationRepository.save(peerEvaluation);
            }
            this.logger.log(`동료평가 답변 저장 완료 - peerEvaluationId: ${command.peerEvaluationId}, 저장된 답변: ${savedCount}개`);
            return savedCount;
        }
        catch (error) {
            this.logger.error(`동료평가 답변 저장 실패 - peerEvaluationId: ${command.peerEvaluationId}`, error.stack);
            throw error;
        }
    }
};
exports.UpsertPeerEvaluationAnswersHandler = UpsertPeerEvaluationAnswersHandler;
exports.UpsertPeerEvaluationAnswersHandler = UpsertPeerEvaluationAnswersHandler = UpsertPeerEvaluationAnswersHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(UpsertPeerEvaluationAnswersCommand),
    __param(2, (0, typeorm_1.InjectRepository)(peer_evaluation_entity_1.PeerEvaluation)),
    __metadata("design:paramtypes", [peer_evaluation_service_1.PeerEvaluationService,
        peer_evaluation_question_mapping_service_1.PeerEvaluationQuestionMappingService,
        typeorm_2.Repository])
], UpsertPeerEvaluationAnswersHandler);
//# sourceMappingURL=upsert-peer-evaluation-answers.handler.js.map