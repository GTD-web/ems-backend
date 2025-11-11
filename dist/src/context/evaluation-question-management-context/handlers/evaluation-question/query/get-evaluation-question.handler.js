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
var GetEvaluationQuestionHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetEvaluationQuestionHandler = exports.GetEvaluationQuestionQuery = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const evaluation_question_service_1 = require("../../../../../domain/sub/evaluation-question/evaluation-question.service");
class GetEvaluationQuestionQuery {
    id;
    constructor(id) {
        this.id = id;
    }
}
exports.GetEvaluationQuestionQuery = GetEvaluationQuestionQuery;
let GetEvaluationQuestionHandler = GetEvaluationQuestionHandler_1 = class GetEvaluationQuestionHandler {
    evaluationQuestionService;
    logger = new common_1.Logger(GetEvaluationQuestionHandler_1.name);
    constructor(evaluationQuestionService) {
        this.evaluationQuestionService = evaluationQuestionService;
    }
    async execute(query) {
        this.logger.log('평가 질문 조회 시작', query);
        const evaluationQuestion = await this.evaluationQuestionService.ID로조회한다(query.id);
        if (!evaluationQuestion) {
            throw new common_1.NotFoundException(`평가 질문을 찾을 수 없습니다. (id: ${query.id})`);
        }
        return evaluationQuestion.DTO로_변환한다();
    }
};
exports.GetEvaluationQuestionHandler = GetEvaluationQuestionHandler;
exports.GetEvaluationQuestionHandler = GetEvaluationQuestionHandler = GetEvaluationQuestionHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(GetEvaluationQuestionQuery),
    __metadata("design:paramtypes", [evaluation_question_service_1.EvaluationQuestionService])
], GetEvaluationQuestionHandler);
//# sourceMappingURL=get-evaluation-question.handler.js.map