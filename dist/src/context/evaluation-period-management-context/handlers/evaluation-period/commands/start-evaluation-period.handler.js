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
exports.StartEvaluationPeriodCommandHandler = exports.StartEvaluationPeriodCommand = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const evaluation_period_service_1 = require("../../../../../domain/core/evaluation-period/evaluation-period.service");
class StartEvaluationPeriodCommand {
    periodId;
    startedBy;
    constructor(periodId, startedBy) {
        this.periodId = periodId;
        this.startedBy = startedBy;
    }
}
exports.StartEvaluationPeriodCommand = StartEvaluationPeriodCommand;
let StartEvaluationPeriodCommandHandler = class StartEvaluationPeriodCommandHandler {
    evaluationPeriodService;
    constructor(evaluationPeriodService) {
        this.evaluationPeriodService = evaluationPeriodService;
    }
    async execute(command) {
        const result = await this.evaluationPeriodService.시작한다(command.periodId, command.startedBy);
        if (!result) {
            return false;
        }
        return true;
    }
};
exports.StartEvaluationPeriodCommandHandler = StartEvaluationPeriodCommandHandler;
exports.StartEvaluationPeriodCommandHandler = StartEvaluationPeriodCommandHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(StartEvaluationPeriodCommand),
    __metadata("design:paramtypes", [evaluation_period_service_1.EvaluationPeriodService])
], StartEvaluationPeriodCommandHandler);
//# sourceMappingURL=start-evaluation-period.handler.js.map