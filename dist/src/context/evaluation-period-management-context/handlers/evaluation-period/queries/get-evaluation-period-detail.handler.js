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
exports.GetEvaluationPeriodDetailQueryHandler = exports.GetEvaluationPeriodDetailQuery = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const evaluation_period_service_1 = require("../../../../../domain/core/evaluation-period/evaluation-period.service");
class GetEvaluationPeriodDetailQuery {
    periodId;
    constructor(periodId) {
        this.periodId = periodId;
    }
}
exports.GetEvaluationPeriodDetailQuery = GetEvaluationPeriodDetailQuery;
let GetEvaluationPeriodDetailQueryHandler = class GetEvaluationPeriodDetailQueryHandler {
    evaluationPeriodService;
    constructor(evaluationPeriodService) {
        this.evaluationPeriodService = evaluationPeriodService;
    }
    async execute(query) {
        const period = await this.evaluationPeriodService.ID로_조회한다(query.periodId);
        return period;
    }
};
exports.GetEvaluationPeriodDetailQueryHandler = GetEvaluationPeriodDetailQueryHandler;
exports.GetEvaluationPeriodDetailQueryHandler = GetEvaluationPeriodDetailQueryHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(GetEvaluationPeriodDetailQuery),
    __metadata("design:paramtypes", [evaluation_period_service_1.EvaluationPeriodService])
], GetEvaluationPeriodDetailQueryHandler);
//# sourceMappingURL=get-evaluation-period-detail.handler.js.map