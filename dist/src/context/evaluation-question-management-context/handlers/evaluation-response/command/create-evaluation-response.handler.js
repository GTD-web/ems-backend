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
var CreateEvaluationResponseHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateEvaluationResponseHandler = exports.CreateEvaluationResponseCommand = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const evaluation_response_service_1 = require("../../../../../domain/sub/evaluation-response/evaluation-response.service");
class CreateEvaluationResponseCommand {
    data;
    createdBy;
    constructor(data, createdBy) {
        this.data = data;
        this.createdBy = createdBy;
    }
}
exports.CreateEvaluationResponseCommand = CreateEvaluationResponseCommand;
let CreateEvaluationResponseHandler = CreateEvaluationResponseHandler_1 = class CreateEvaluationResponseHandler {
    evaluationResponseService;
    logger = new common_1.Logger(CreateEvaluationResponseHandler_1.name);
    constructor(evaluationResponseService) {
        this.evaluationResponseService = evaluationResponseService;
    }
    async execute(command) {
        this.logger.log('평가 응답 생성 시작', command);
        const { data, createdBy } = command;
        const evaluationResponse = await this.evaluationResponseService.생성한다(data, createdBy);
        this.logger.log(`평가 응답 생성 완료 - ID: ${evaluationResponse.id}, 평가: ${data.evaluationId}, 질문: ${data.questionId}`);
        return evaluationResponse.id;
    }
};
exports.CreateEvaluationResponseHandler = CreateEvaluationResponseHandler;
exports.CreateEvaluationResponseHandler = CreateEvaluationResponseHandler = CreateEvaluationResponseHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(CreateEvaluationResponseCommand),
    __metadata("design:paramtypes", [evaluation_response_service_1.EvaluationResponseService])
], CreateEvaluationResponseHandler);
//# sourceMappingURL=create-evaluation-response.handler.js.map