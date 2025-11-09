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
var GetEvaluationResponseStatsHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetEvaluationResponseStatsHandler = exports.GetEvaluationResponseStatsQuery = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const evaluation_response_service_1 = require("../../../../../domain/sub/evaluation-response/evaluation-response.service");
class GetEvaluationResponseStatsQuery {
    evaluationId;
    constructor(evaluationId) {
        this.evaluationId = evaluationId;
    }
}
exports.GetEvaluationResponseStatsQuery = GetEvaluationResponseStatsQuery;
let GetEvaluationResponseStatsHandler = GetEvaluationResponseStatsHandler_1 = class GetEvaluationResponseStatsHandler {
    evaluationResponseService;
    logger = new common_1.Logger(GetEvaluationResponseStatsHandler_1.name);
    constructor(evaluationResponseService) {
        this.evaluationResponseService = evaluationResponseService;
    }
    async execute(query) {
        this.logger.log('평가 응답 통계 조회 시작', query);
        const stats = await this.evaluationResponseService.평가응답통계조회한다(query.evaluationId);
        return stats;
    }
};
exports.GetEvaluationResponseStatsHandler = GetEvaluationResponseStatsHandler;
exports.GetEvaluationResponseStatsHandler = GetEvaluationResponseStatsHandler = GetEvaluationResponseStatsHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(GetEvaluationResponseStatsQuery),
    __metadata("design:paramtypes", [evaluation_response_service_1.EvaluationResponseService])
], GetEvaluationResponseStatsHandler);
//# sourceMappingURL=get-evaluation-response-stats.handler.js.map