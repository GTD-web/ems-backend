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
exports.UpdateEvaluationPeriodBasicInfoCommandHandler = exports.UpdateEvaluationPeriodBasicInfoCommand = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const evaluation_period_service_1 = require("../../../../../domain/core/evaluation-period/evaluation-period.service");
class UpdateEvaluationPeriodBasicInfoCommand {
    periodId;
    updateData;
    updatedBy;
    constructor(periodId, updateData, updatedBy) {
        this.periodId = periodId;
        this.updateData = updateData;
        this.updatedBy = updatedBy;
    }
}
exports.UpdateEvaluationPeriodBasicInfoCommand = UpdateEvaluationPeriodBasicInfoCommand;
let UpdateEvaluationPeriodBasicInfoCommandHandler = class UpdateEvaluationPeriodBasicInfoCommandHandler {
    evaluationPeriodService;
    constructor(evaluationPeriodService) {
        this.evaluationPeriodService = evaluationPeriodService;
    }
    async execute(command) {
        const { periodId, updateData, updatedBy } = command;
        const updateDto = {
            name: updateData.name,
            description: updateData.description,
            maxSelfEvaluationRate: updateData.maxSelfEvaluationRate,
        };
        const updatedPeriod = await this.evaluationPeriodService.업데이트한다(periodId, updateDto, updatedBy);
        return updatedPeriod;
    }
};
exports.UpdateEvaluationPeriodBasicInfoCommandHandler = UpdateEvaluationPeriodBasicInfoCommandHandler;
exports.UpdateEvaluationPeriodBasicInfoCommandHandler = UpdateEvaluationPeriodBasicInfoCommandHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(UpdateEvaluationPeriodBasicInfoCommand),
    __metadata("design:paramtypes", [evaluation_period_service_1.EvaluationPeriodService])
], UpdateEvaluationPeriodBasicInfoCommandHandler);
//# sourceMappingURL=update-evaluation-period-basic-info.handler.js.map