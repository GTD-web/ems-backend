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
var UpdateEvaluationQuestionHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateEvaluationQuestionHandler = exports.UpdateEvaluationQuestionCommand = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const evaluation_question_service_1 = require("../../../../../domain/sub/evaluation-question/evaluation-question.service");
class UpdateEvaluationQuestionCommand {
    id;
    data;
    updatedBy;
    constructor(id, data, updatedBy) {
        this.id = id;
        this.data = data;
        this.updatedBy = updatedBy;
    }
}
exports.UpdateEvaluationQuestionCommand = UpdateEvaluationQuestionCommand;
let UpdateEvaluationQuestionHandler = UpdateEvaluationQuestionHandler_1 = class UpdateEvaluationQuestionHandler {
    evaluationQuestionService;
    logger = new common_1.Logger(UpdateEvaluationQuestionHandler_1.name);
    constructor(evaluationQuestionService) {
        this.evaluationQuestionService = evaluationQuestionService;
    }
    async execute(command) {
        this.logger.log('평가 질문 수정 시작', command);
        const { id, data, updatedBy } = command;
        await this.evaluationQuestionService.업데이트한다(id, data, updatedBy);
        this.logger.log(`평가 질문 수정 완료 - ID: ${id}`);
    }
};
exports.UpdateEvaluationQuestionHandler = UpdateEvaluationQuestionHandler;
exports.UpdateEvaluationQuestionHandler = UpdateEvaluationQuestionHandler = UpdateEvaluationQuestionHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(UpdateEvaluationQuestionCommand),
    __metadata("design:paramtypes", [evaluation_question_service_1.EvaluationQuestionService])
], UpdateEvaluationQuestionHandler);
//# sourceMappingURL=update-evaluation-question.handler.js.map