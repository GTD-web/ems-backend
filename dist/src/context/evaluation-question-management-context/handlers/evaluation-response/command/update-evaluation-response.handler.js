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
var UpdateEvaluationResponseHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateEvaluationResponseHandler = exports.UpdateEvaluationResponseCommand = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const evaluation_response_service_1 = require("../../../../../domain/sub/evaluation-response/evaluation-response.service");
class UpdateEvaluationResponseCommand {
    id;
    data;
    updatedBy;
    constructor(id, data, updatedBy) {
        this.id = id;
        this.data = data;
        this.updatedBy = updatedBy;
    }
}
exports.UpdateEvaluationResponseCommand = UpdateEvaluationResponseCommand;
let UpdateEvaluationResponseHandler = UpdateEvaluationResponseHandler_1 = class UpdateEvaluationResponseHandler {
    evaluationResponseService;
    logger = new common_1.Logger(UpdateEvaluationResponseHandler_1.name);
    constructor(evaluationResponseService) {
        this.evaluationResponseService = evaluationResponseService;
    }
    async execute(command) {
        this.logger.log('평가 응답 수정 시작', command);
        const { id, data, updatedBy } = command;
        await this.evaluationResponseService.업데이트한다(id, data, updatedBy);
        this.logger.log(`평가 응답 수정 완료 - ID: ${id}`);
    }
};
exports.UpdateEvaluationResponseHandler = UpdateEvaluationResponseHandler;
exports.UpdateEvaluationResponseHandler = UpdateEvaluationResponseHandler = UpdateEvaluationResponseHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(UpdateEvaluationResponseCommand),
    __metadata("design:paramtypes", [evaluation_response_service_1.EvaluationResponseService])
], UpdateEvaluationResponseHandler);
//# sourceMappingURL=update-evaluation-response.handler.js.map