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
var CancelPeerEvaluationsByPeriodHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CancelPeerEvaluationsByPeriodHandler = exports.CancelPeerEvaluationsByPeriodCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const peer_evaluation_service_1 = require("../../../../../domain/core/peer-evaluation/peer-evaluation.service");
class CancelPeerEvaluationsByPeriodCommand {
    evaluateeId;
    periodId;
    cancelledBy;
    constructor(evaluateeId, periodId, cancelledBy) {
        this.evaluateeId = evaluateeId;
        this.periodId = periodId;
        this.cancelledBy = cancelledBy;
    }
}
exports.CancelPeerEvaluationsByPeriodCommand = CancelPeerEvaluationsByPeriodCommand;
let CancelPeerEvaluationsByPeriodHandler = CancelPeerEvaluationsByPeriodHandler_1 = class CancelPeerEvaluationsByPeriodHandler {
    peerEvaluationService;
    logger = new common_1.Logger(CancelPeerEvaluationsByPeriodHandler_1.name);
    constructor(peerEvaluationService) {
        this.peerEvaluationService = peerEvaluationService;
    }
    async execute(command) {
        this.logger.log(`평가기간의 피평가자의 모든 동료평가 취소 핸들러 실행 - 피평가자 ID: ${command.evaluateeId}, 평가기간 ID: ${command.periodId}`);
        const evaluations = await this.peerEvaluationService.필터_조회한다({
            evaluateeId: command.evaluateeId,
            periodId: command.periodId,
        });
        this.logger.debug(`조회된 동료평가 개수: ${evaluations.length}개`);
        if (evaluations.length === 0) {
            this.logger.warn(`취소할 동료평가를 찾을 수 없습니다 - 피평가자 ID: ${command.evaluateeId}, 평가기간 ID: ${command.periodId}`);
            return { cancelledCount: 0 };
        }
        const evaluationIds = evaluations.map((evaluation) => evaluation.id);
        this.logger.debug(`추출된 평가 ID 개수: ${evaluationIds.length}개`);
        const cancelledEvaluations = await this.peerEvaluationService.일괄_취소한다(evaluationIds, command.cancelledBy);
        this.logger.log(`평가기간의 피평가자의 모든 동료평가 취소 완료 - 취소된 개수: ${cancelledEvaluations.length}개`);
        return { cancelledCount: cancelledEvaluations.length };
    }
};
exports.CancelPeerEvaluationsByPeriodHandler = CancelPeerEvaluationsByPeriodHandler;
exports.CancelPeerEvaluationsByPeriodHandler = CancelPeerEvaluationsByPeriodHandler = CancelPeerEvaluationsByPeriodHandler_1 = __decorate([
    (0, cqrs_1.CommandHandler)(CancelPeerEvaluationsByPeriodCommand),
    __metadata("design:paramtypes", [peer_evaluation_service_1.PeerEvaluationService])
], CancelPeerEvaluationsByPeriodHandler);
//# sourceMappingURL=cancel-peer-evaluations-by-period.handler.js.map