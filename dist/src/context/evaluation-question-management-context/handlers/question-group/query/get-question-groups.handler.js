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
var GetQuestionGroupsHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetQuestionGroupsHandler = exports.GetQuestionGroupsQuery = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const question_group_service_1 = require("../../../../../domain/sub/question-group/question-group.service");
class GetQuestionGroupsQuery {
    filter;
    constructor(filter) {
        this.filter = filter;
    }
}
exports.GetQuestionGroupsQuery = GetQuestionGroupsQuery;
let GetQuestionGroupsHandler = GetQuestionGroupsHandler_1 = class GetQuestionGroupsHandler {
    questionGroupService;
    logger = new common_1.Logger(GetQuestionGroupsHandler_1.name);
    constructor(questionGroupService) {
        this.questionGroupService = questionGroupService;
    }
    async execute(query) {
        this.logger.log('질문 그룹 목록 조회 시작', query);
        const questionGroups = query.filter
            ? await this.questionGroupService.필터조회한다(query.filter)
            : await this.questionGroupService.전체조회한다();
        return questionGroups.map((group) => group.DTO로_변환한다());
    }
};
exports.GetQuestionGroupsHandler = GetQuestionGroupsHandler;
exports.GetQuestionGroupsHandler = GetQuestionGroupsHandler = GetQuestionGroupsHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(GetQuestionGroupsQuery),
    __metadata("design:paramtypes", [question_group_service_1.QuestionGroupService])
], GetQuestionGroupsHandler);
//# sourceMappingURL=get-question-groups.handler.js.map