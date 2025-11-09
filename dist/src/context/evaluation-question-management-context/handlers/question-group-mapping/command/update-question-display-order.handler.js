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
var UpdateQuestionDisplayOrderHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateQuestionDisplayOrderHandler = exports.UpdateQuestionDisplayOrderCommand = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const question_group_mapping_service_1 = require("../../../../../domain/sub/question-group-mapping/question-group-mapping.service");
class UpdateQuestionDisplayOrderCommand {
    mappingId;
    displayOrder;
    updatedBy;
    constructor(mappingId, displayOrder, updatedBy) {
        this.mappingId = mappingId;
        this.displayOrder = displayOrder;
        this.updatedBy = updatedBy;
    }
}
exports.UpdateQuestionDisplayOrderCommand = UpdateQuestionDisplayOrderCommand;
let UpdateQuestionDisplayOrderHandler = UpdateQuestionDisplayOrderHandler_1 = class UpdateQuestionDisplayOrderHandler {
    questionGroupMappingService;
    logger = new common_1.Logger(UpdateQuestionDisplayOrderHandler_1.name);
    constructor(questionGroupMappingService) {
        this.questionGroupMappingService = questionGroupMappingService;
    }
    async execute(command) {
        this.logger.log('질문 표시 순서 변경 시작', command);
        const { mappingId, displayOrder, updatedBy } = command;
        await this.questionGroupMappingService.업데이트한다(mappingId, { displayOrder }, updatedBy);
        this.logger.log(`질문 표시 순서 변경 완료 - 매핑 ID: ${mappingId}, 순서: ${displayOrder}`);
    }
};
exports.UpdateQuestionDisplayOrderHandler = UpdateQuestionDisplayOrderHandler;
exports.UpdateQuestionDisplayOrderHandler = UpdateQuestionDisplayOrderHandler = UpdateQuestionDisplayOrderHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(UpdateQuestionDisplayOrderCommand),
    __metadata("design:paramtypes", [question_group_mapping_service_1.QuestionGroupMappingService])
], UpdateQuestionDisplayOrderHandler);
//# sourceMappingURL=update-question-display-order.handler.js.map