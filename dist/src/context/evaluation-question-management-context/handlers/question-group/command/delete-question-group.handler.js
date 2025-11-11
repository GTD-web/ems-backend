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
var DeleteQuestionGroupHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteQuestionGroupHandler = exports.DeleteQuestionGroupCommand = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const question_group_service_1 = require("../../../../../domain/sub/question-group/question-group.service");
class DeleteQuestionGroupCommand {
    id;
    deletedBy;
    constructor(id, deletedBy) {
        this.id = id;
        this.deletedBy = deletedBy;
    }
}
exports.DeleteQuestionGroupCommand = DeleteQuestionGroupCommand;
let DeleteQuestionGroupHandler = DeleteQuestionGroupHandler_1 = class DeleteQuestionGroupHandler {
    questionGroupService;
    logger = new common_1.Logger(DeleteQuestionGroupHandler_1.name);
    constructor(questionGroupService) {
        this.questionGroupService = questionGroupService;
    }
    async execute(command) {
        this.logger.log('질문 그룹 삭제 시작', command);
        const { id, deletedBy } = command;
        await this.questionGroupService.삭제한다(id, deletedBy);
        this.logger.log(`질문 그룹 삭제 완료 - ID: ${id}`);
    }
};
exports.DeleteQuestionGroupHandler = DeleteQuestionGroupHandler;
exports.DeleteQuestionGroupHandler = DeleteQuestionGroupHandler = DeleteQuestionGroupHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(DeleteQuestionGroupCommand),
    __metadata("design:paramtypes", [question_group_service_1.QuestionGroupService])
], DeleteQuestionGroupHandler);
//# sourceMappingURL=delete-question-group.handler.js.map