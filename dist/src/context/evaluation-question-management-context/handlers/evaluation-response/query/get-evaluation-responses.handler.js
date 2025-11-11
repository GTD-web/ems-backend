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
var GetEvaluationResponsesHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetEvaluationResponsesHandler = exports.GetEvaluationResponsesQuery = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const evaluation_response_service_1 = require("../../../../../domain/sub/evaluation-response/evaluation-response.service");
class GetEvaluationResponsesQuery {
    filter;
    constructor(filter) {
        this.filter = filter;
    }
}
exports.GetEvaluationResponsesQuery = GetEvaluationResponsesQuery;
let GetEvaluationResponsesHandler = GetEvaluationResponsesHandler_1 = class GetEvaluationResponsesHandler {
    evaluationResponseService;
    logger = new common_1.Logger(GetEvaluationResponsesHandler_1.name);
    constructor(evaluationResponseService) {
        this.evaluationResponseService = evaluationResponseService;
    }
    async execute(query) {
        this.logger.log('평가 응답 목록 조회 시작', query);
        const evaluationResponses = await this.evaluationResponseService.필터조회한다(query.filter);
        return evaluationResponses.map((response) => response.DTO로_변환한다());
    }
};
exports.GetEvaluationResponsesHandler = GetEvaluationResponsesHandler;
exports.GetEvaluationResponsesHandler = GetEvaluationResponsesHandler = GetEvaluationResponsesHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(GetEvaluationResponsesQuery),
    __metadata("design:paramtypes", [evaluation_response_service_1.EvaluationResponseService])
], GetEvaluationResponsesHandler);
//# sourceMappingURL=get-evaluation-responses.handler.js.map