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
var CancelPeerEvaluationHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CancelPeerEvaluationHandler = exports.CancelPeerEvaluationCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const peer_evaluation_service_1 = require("../../../../../domain/core/peer-evaluation/peer-evaluation.service");
class CancelPeerEvaluationCommand {
    evaluationId;
    cancelledBy;
    constructor(evaluationId, cancelledBy) {
        this.evaluationId = evaluationId;
        this.cancelledBy = cancelledBy;
    }
}
exports.CancelPeerEvaluationCommand = CancelPeerEvaluationCommand;
let CancelPeerEvaluationHandler = CancelPeerEvaluationHandler_1 = class CancelPeerEvaluationHandler {
    peerEvaluationService;
    logger = new common_1.Logger(CancelPeerEvaluationHandler_1.name);
    constructor(peerEvaluationService) {
        this.peerEvaluationService = peerEvaluationService;
    }
    async execute(command) {
        this.logger.log(`동료평가 취소 핸들러 실행 - 평가 ID: ${command.evaluationId}`);
        await this.peerEvaluationService.취소한다(command.evaluationId, command.cancelledBy);
        this.logger.log(`동료평가 취소 핸들러 완료 - 평가 ID: ${command.evaluationId}`);
    }
};
exports.CancelPeerEvaluationHandler = CancelPeerEvaluationHandler;
exports.CancelPeerEvaluationHandler = CancelPeerEvaluationHandler = CancelPeerEvaluationHandler_1 = __decorate([
    (0, cqrs_1.CommandHandler)(CancelPeerEvaluationCommand),
    __metadata("design:paramtypes", [peer_evaluation_service_1.PeerEvaluationService])
], CancelPeerEvaluationHandler);
//# sourceMappingURL=cancel-peer-evaluation.handler.js.map