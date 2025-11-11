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
var GetEvaluationTargetsByFilterHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetEvaluationTargetsByFilterHandler = exports.GetEvaluationTargetsByFilterQuery = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const evaluation_period_employee_mapping_service_1 = require("../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service");
class GetEvaluationTargetsByFilterQuery {
    filter;
    constructor(filter) {
        this.filter = filter;
    }
}
exports.GetEvaluationTargetsByFilterQuery = GetEvaluationTargetsByFilterQuery;
let GetEvaluationTargetsByFilterHandler = GetEvaluationTargetsByFilterHandler_1 = class GetEvaluationTargetsByFilterHandler {
    evaluationPeriodEmployeeMappingService;
    logger = new common_1.Logger(GetEvaluationTargetsByFilterHandler_1.name);
    constructor(evaluationPeriodEmployeeMappingService) {
        this.evaluationPeriodEmployeeMappingService = evaluationPeriodEmployeeMappingService;
    }
    async execute(query) {
        const { filter } = query;
        this.logger.debug(`필터로 평가대상자 조회 - 필터: ${JSON.stringify(filter)}`);
        try {
            const results = await this.evaluationPeriodEmployeeMappingService.필터로_평가대상자를_조회한다(filter);
            this.logger.debug(`필터로 평가대상자 조회 완료 - 대상자 수: ${results.length}`);
            return results;
        }
        catch (error) {
            this.logger.error(`필터로 평가대상자 조회 실패 - 필터: ${JSON.stringify(filter)}`, error.stack);
            throw error;
        }
    }
};
exports.GetEvaluationTargetsByFilterHandler = GetEvaluationTargetsByFilterHandler;
exports.GetEvaluationTargetsByFilterHandler = GetEvaluationTargetsByFilterHandler = GetEvaluationTargetsByFilterHandler_1 = __decorate([
    (0, cqrs_1.QueryHandler)(GetEvaluationTargetsByFilterQuery),
    __metadata("design:paramtypes", [evaluation_period_employee_mapping_service_1.EvaluationPeriodEmployeeMappingService])
], GetEvaluationTargetsByFilterHandler);
//# sourceMappingURL=get-evaluation-targets-by-filter.handler.js.map