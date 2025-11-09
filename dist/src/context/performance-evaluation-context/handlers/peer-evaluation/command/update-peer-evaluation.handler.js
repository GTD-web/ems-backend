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
var UpdatePeerEvaluationHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePeerEvaluationHandler = exports.UpdatePeerEvaluationCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const peer_evaluation_service_1 = require("../../../../../domain/core/peer-evaluation/peer-evaluation.service");
const transaction_manager_service_1 = require("../../../../../../libs/database/transaction-manager.service");
class UpdatePeerEvaluationCommand {
    evaluationId;
    updatedBy;
    constructor(evaluationId, updatedBy = '시스템') {
        this.evaluationId = evaluationId;
        this.updatedBy = updatedBy;
    }
}
exports.UpdatePeerEvaluationCommand = UpdatePeerEvaluationCommand;
let UpdatePeerEvaluationHandler = UpdatePeerEvaluationHandler_1 = class UpdatePeerEvaluationHandler {
    peerEvaluationService;
    transactionManager;
    logger = new common_1.Logger(UpdatePeerEvaluationHandler_1.name);
    constructor(peerEvaluationService, transactionManager) {
        this.peerEvaluationService = peerEvaluationService;
        this.transactionManager = transactionManager;
    }
    async execute(command) {
        const { evaluationId, updatedBy } = command;
        this.logger.log('동료평가 수정 핸들러 실행', { evaluationId });
        return await this.transactionManager.executeTransaction(async () => {
            await this.peerEvaluationService.수정한다(evaluationId, {}, updatedBy);
            this.logger.log('동료평가 수정 완료', { evaluationId });
        });
    }
};
exports.UpdatePeerEvaluationHandler = UpdatePeerEvaluationHandler;
exports.UpdatePeerEvaluationHandler = UpdatePeerEvaluationHandler = UpdatePeerEvaluationHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(UpdatePeerEvaluationCommand),
    __metadata("design:paramtypes", [peer_evaluation_service_1.PeerEvaluationService,
        transaction_manager_service_1.TransactionManagerService])
], UpdatePeerEvaluationHandler);
//# sourceMappingURL=update-peer-evaluation.handler.js.map