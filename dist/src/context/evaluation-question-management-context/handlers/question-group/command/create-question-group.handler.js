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
var CreateQuestionGroupHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateQuestionGroupHandler = exports.CreateQuestionGroupCommand = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const question_group_service_1 = require("../../../../../domain/sub/question-group/question-group.service");
class CreateQuestionGroupCommand {
    data;
    createdBy;
    constructor(data, createdBy) {
        this.data = data;
        this.createdBy = createdBy;
    }
}
exports.CreateQuestionGroupCommand = CreateQuestionGroupCommand;
let CreateQuestionGroupHandler = CreateQuestionGroupHandler_1 = class CreateQuestionGroupHandler {
    questionGroupService;
    logger = new common_1.Logger(CreateQuestionGroupHandler_1.name);
    constructor(questionGroupService) {
        this.questionGroupService = questionGroupService;
    }
    async execute(command) {
        this.logger.log('질문 그룹 생성 시작', command);
        const { data, createdBy } = command;
        const questionGroup = await this.questionGroupService.생성한다(data, createdBy);
        this.logger.log(`질문 그룹 생성 완료 - ID: ${questionGroup.id}, 그룹명: ${questionGroup.name}`);
        return questionGroup.id;
    }
};
exports.CreateQuestionGroupHandler = CreateQuestionGroupHandler;
exports.CreateQuestionGroupHandler = CreateQuestionGroupHandler = CreateQuestionGroupHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(CreateQuestionGroupCommand),
    __metadata("design:paramtypes", [question_group_service_1.QuestionGroupService])
], CreateQuestionGroupHandler);
//# sourceMappingURL=create-question-group.handler.js.map