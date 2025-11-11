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
var GetEvaluationQuestionsHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetEvaluationQuestionsHandler = exports.GetEvaluationQuestionsQuery = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const evaluation_question_service_1 = require("../../../../../domain/sub/evaluation-question/evaluation-question.service");
class GetEvaluationQuestionsQuery {
    filter;
    constructor(filter) {
        this.filter = filter;
    }
}
exports.GetEvaluationQuestionsQuery = GetEvaluationQuestionsQuery;
let GetEvaluationQuestionsHandler = GetEvaluationQuestionsHandler_1 = class GetEvaluationQuestionsHandler {
    evaluationQuestionService;
    logger = new common_1.Logger(GetEvaluationQuestionsHandler_1.name);
    constructor(evaluationQuestionService) {
        this.evaluationQuestionService = evaluationQuestionService;
    }
    async execute(query) {
        this.logger.log('평가 질문 목록 조회 시작', query);
        const evaluationQuestions = query.filter
            ? await this.evaluationQuestionService.필터조회한다(query.filter)
            : await this.evaluationQuestionService.전체조회한다();
        return evaluationQuestions.map((question) => question.DTO로_변환한다());
    }
};
exports.GetEvaluationQuestionsHandler = GetEvaluationQuestionsHandler;
exports.GetEvaluationQuestionsHandler = GetEvaluationQuestionsHandler = GetEvaluationQuestionsHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(GetEvaluationQuestionsQuery),
    __metadata("design:paramtypes", [evaluation_question_service_1.EvaluationQuestionService])
], GetEvaluationQuestionsHandler);
//# sourceMappingURL=get-evaluation-questions.handler.js.map