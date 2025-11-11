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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePeerEvaluationDeadlineCommandHandler = exports.UpdatePeerEvaluationDeadlineCommand = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const evaluation_period_service_1 = require("../../../../../domain/core/evaluation-period/evaluation-period.service");
class UpdatePeerEvaluationDeadlineCommand {
    periodId;
    deadlineData;
    updatedBy;
    constructor(periodId, deadlineData, updatedBy) {
        this.periodId = periodId;
        this.deadlineData = deadlineData;
        this.updatedBy = updatedBy;
    }
}
exports.UpdatePeerEvaluationDeadlineCommand = UpdatePeerEvaluationDeadlineCommand;
let UpdatePeerEvaluationDeadlineCommandHandler = class UpdatePeerEvaluationDeadlineCommandHandler {
    evaluationPeriodService;
    constructor(evaluationPeriodService) {
        this.evaluationPeriodService = evaluationPeriodService;
    }
    async execute(command) {
        const { periodId, deadlineData, updatedBy } = command;
        const updateDto = {
            peerEvaluationDeadline: deadlineData.peerEvaluationDeadline,
        };
        const updatedPeriod = await this.evaluationPeriodService.업데이트한다(periodId, updateDto, updatedBy);
        return updatedPeriod;
    }
};
exports.UpdatePeerEvaluationDeadlineCommandHandler = UpdatePeerEvaluationDeadlineCommandHandler;
exports.UpdatePeerEvaluationDeadlineCommandHandler = UpdatePeerEvaluationDeadlineCommandHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(UpdatePeerEvaluationDeadlineCommand),
    __metadata("design:paramtypes", [evaluation_period_service_1.EvaluationPeriodService])
], UpdatePeerEvaluationDeadlineCommandHandler);
//# sourceMappingURL=update-peer-evaluation-deadline.handler.js.map