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
var CopyEvaluationQuestionHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CopyEvaluationQuestionHandler = exports.CopyEvaluationQuestionCommand = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const evaluation_question_service_1 = require("../../../../../domain/sub/evaluation-question/evaluation-question.service");
class CopyEvaluationQuestionCommand {
    id;
    copiedBy;
    constructor(id, copiedBy) {
        this.id = id;
        this.copiedBy = copiedBy;
    }
}
exports.CopyEvaluationQuestionCommand = CopyEvaluationQuestionCommand;
let CopyEvaluationQuestionHandler = CopyEvaluationQuestionHandler_1 = class CopyEvaluationQuestionHandler {
    evaluationQuestionService;
    logger = new common_1.Logger(CopyEvaluationQuestionHandler_1.name);
    constructor(evaluationQuestionService) {
        this.evaluationQuestionService = evaluationQuestionService;
    }
    async execute(command) {
        this.logger.log('평가 질문 복사 시작', command);
        const { id, copiedBy } = command;
        const newQuestion = await this.evaluationQuestionService.복사한다(id, copiedBy);
        this.logger.log(`평가 질문 복사 완료 - 새 ID: ${newQuestion.id}`);
        return newQuestion.id;
    }
};
exports.CopyEvaluationQuestionHandler = CopyEvaluationQuestionHandler;
exports.CopyEvaluationQuestionHandler = CopyEvaluationQuestionHandler = CopyEvaluationQuestionHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(CopyEvaluationQuestionCommand),
    __metadata("design:paramtypes", [evaluation_question_service_1.EvaluationQuestionService])
], CopyEvaluationQuestionHandler);
//# sourceMappingURL=copy-evaluation-question.handler.js.map