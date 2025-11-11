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
var DeleteEvaluationQuestionHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteEvaluationQuestionHandler = exports.DeleteEvaluationQuestionCommand = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const evaluation_question_service_1 = require("../../../../../domain/sub/evaluation-question/evaluation-question.service");
class DeleteEvaluationQuestionCommand {
    id;
    deletedBy;
    constructor(id, deletedBy) {
        this.id = id;
        this.deletedBy = deletedBy;
    }
}
exports.DeleteEvaluationQuestionCommand = DeleteEvaluationQuestionCommand;
let DeleteEvaluationQuestionHandler = DeleteEvaluationQuestionHandler_1 = class DeleteEvaluationQuestionHandler {
    evaluationQuestionService;
    logger = new common_1.Logger(DeleteEvaluationQuestionHandler_1.name);
    constructor(evaluationQuestionService) {
        this.evaluationQuestionService = evaluationQuestionService;
    }
    async execute(command) {
        this.logger.log('평가 질문 삭제 시작', command);
        const { id, deletedBy } = command;
        await this.evaluationQuestionService.삭제한다(id, deletedBy);
        this.logger.log(`평가 질문 삭제 완료 - ID: ${id}`);
    }
};
exports.DeleteEvaluationQuestionHandler = DeleteEvaluationQuestionHandler;
exports.DeleteEvaluationQuestionHandler = DeleteEvaluationQuestionHandler = DeleteEvaluationQuestionHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(DeleteEvaluationQuestionCommand),
    __metadata("design:paramtypes", [evaluation_question_service_1.EvaluationQuestionService])
], DeleteEvaluationQuestionHandler);
//# sourceMappingURL=delete-evaluation-question.handler.js.map