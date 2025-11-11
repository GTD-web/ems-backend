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
var GetGroupQuestionsHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetGroupQuestionsHandler = exports.GetGroupQuestionsQuery = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const question_group_mapping_service_1 = require("../../../../../domain/sub/question-group-mapping/question-group-mapping.service");
class GetGroupQuestionsQuery {
    groupId;
    constructor(groupId) {
        this.groupId = groupId;
    }
}
exports.GetGroupQuestionsQuery = GetGroupQuestionsQuery;
let GetGroupQuestionsHandler = GetGroupQuestionsHandler_1 = class GetGroupQuestionsHandler {
    questionGroupMappingService;
    logger = new common_1.Logger(GetGroupQuestionsHandler_1.name);
    constructor(questionGroupMappingService) {
        this.questionGroupMappingService = questionGroupMappingService;
    }
    async execute(query) {
        this.logger.log('그룹의 질문 목록 조회 시작', query);
        const mappings = await this.questionGroupMappingService.그룹ID로조회한다(query.groupId);
        return mappings.map((mapping) => mapping.DTO로_변환한다());
    }
};
exports.GetGroupQuestionsHandler = GetGroupQuestionsHandler;
exports.GetGroupQuestionsHandler = GetGroupQuestionsHandler = GetGroupQuestionsHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(GetGroupQuestionsQuery),
    __metadata("design:paramtypes", [question_group_mapping_service_1.QuestionGroupMappingService])
], GetGroupQuestionsHandler);
//# sourceMappingURL=get-group-questions.handler.js.map