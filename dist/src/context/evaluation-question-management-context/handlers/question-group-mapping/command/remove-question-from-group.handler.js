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
var RemoveQuestionFromGroupHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoveQuestionFromGroupHandler = exports.RemoveQuestionFromGroupCommand = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const question_group_mapping_service_1 = require("../../../../../domain/sub/question-group-mapping/question-group-mapping.service");
class RemoveQuestionFromGroupCommand {
    mappingId;
    deletedBy;
    constructor(mappingId, deletedBy) {
        this.mappingId = mappingId;
        this.deletedBy = deletedBy;
    }
}
exports.RemoveQuestionFromGroupCommand = RemoveQuestionFromGroupCommand;
let RemoveQuestionFromGroupHandler = RemoveQuestionFromGroupHandler_1 = class RemoveQuestionFromGroupHandler {
    questionGroupMappingService;
    logger = new common_1.Logger(RemoveQuestionFromGroupHandler_1.name);
    constructor(questionGroupMappingService) {
        this.questionGroupMappingService = questionGroupMappingService;
    }
    async execute(command) {
        this.logger.log('그룹에서 질문 제거 시작', command);
        const { mappingId, deletedBy } = command;
        await this.questionGroupMappingService.삭제한다(mappingId, deletedBy);
        this.logger.log(`그룹에서 질문 제거 완료 - 매핑 ID: ${mappingId}`);
    }
};
exports.RemoveQuestionFromGroupHandler = RemoveQuestionFromGroupHandler;
exports.RemoveQuestionFromGroupHandler = RemoveQuestionFromGroupHandler = RemoveQuestionFromGroupHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(RemoveQuestionFromGroupCommand),
    __metadata("design:paramtypes", [question_group_mapping_service_1.QuestionGroupMappingService])
], RemoveQuestionFromGroupHandler);
//# sourceMappingURL=remove-question-from-group.handler.js.map