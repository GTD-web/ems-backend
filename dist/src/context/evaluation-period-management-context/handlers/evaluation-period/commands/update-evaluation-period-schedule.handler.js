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
exports.UpdateEvaluationPeriodScheduleCommandHandler = exports.UpdateEvaluationPeriodScheduleCommand = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const evaluation_period_service_1 = require("../../../../../domain/core/evaluation-period/evaluation-period.service");
const evaluation_period_auto_phase_service_1 = require("../../../../../domain/core/evaluation-period/evaluation-period-auto-phase.service");
class UpdateEvaluationPeriodScheduleCommand {
    periodId;
    scheduleData;
    updatedBy;
    constructor(periodId, scheduleData, updatedBy) {
        this.periodId = periodId;
        this.scheduleData = scheduleData;
        this.updatedBy = updatedBy;
    }
}
exports.UpdateEvaluationPeriodScheduleCommand = UpdateEvaluationPeriodScheduleCommand;
let UpdateEvaluationPeriodScheduleCommandHandler = class UpdateEvaluationPeriodScheduleCommandHandler {
    evaluationPeriodService;
    evaluationPeriodAutoPhaseService;
    constructor(evaluationPeriodService, evaluationPeriodAutoPhaseService) {
        this.evaluationPeriodService = evaluationPeriodService;
        this.evaluationPeriodAutoPhaseService = evaluationPeriodAutoPhaseService;
    }
    async execute(command) {
        const { periodId, scheduleData, updatedBy } = command;
        const updateDto = {
            startDate: scheduleData.startDate,
            evaluationSetupDeadline: scheduleData.evaluationSetupDeadline,
            performanceDeadline: scheduleData.performanceDeadline,
            selfEvaluationDeadline: scheduleData.selfEvaluationDeadline,
            peerEvaluationDeadline: scheduleData.peerEvaluationDeadline,
        };
        const updatedPeriod = await this.evaluationPeriodService.업데이트한다(periodId, updateDto, updatedBy);
        const adjustedPeriod = await this.evaluationPeriodAutoPhaseService.adjustStatusAndPhaseAfterScheduleUpdate(periodId, updatedBy);
        return (adjustedPeriod || updatedPeriod);
    }
};
exports.UpdateEvaluationPeriodScheduleCommandHandler = UpdateEvaluationPeriodScheduleCommandHandler;
exports.UpdateEvaluationPeriodScheduleCommandHandler = UpdateEvaluationPeriodScheduleCommandHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(UpdateEvaluationPeriodScheduleCommand),
    __metadata("design:paramtypes", [evaluation_period_service_1.EvaluationPeriodService,
        evaluation_period_auto_phase_service_1.EvaluationPeriodAutoPhaseService])
], UpdateEvaluationPeriodScheduleCommandHandler);
//# sourceMappingURL=update-evaluation-period-schedule.handler.js.map