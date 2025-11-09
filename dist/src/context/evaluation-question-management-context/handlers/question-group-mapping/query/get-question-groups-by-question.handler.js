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
var GetQuestionGroupsByQuestionHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetQuestionGroupsByQuestionHandler = exports.GetQuestionGroupsByQuestionQuery = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const question_group_mapping_service_1 = require("../../../../../domain/sub/question-group-mapping/question-group-mapping.service");
class GetQuestionGroupsByQuestionQuery {
    questionId;
    constructor(questionId) {
        this.questionId = questionId;
    }
}
exports.GetQuestionGroupsByQuestionQuery = GetQuestionGroupsByQuestionQuery;
let GetQuestionGroupsByQuestionHandler = GetQuestionGroupsByQuestionHandler_1 = class GetQuestionGroupsByQuestionHandler {
    questionGroupMappingService;
    logger = new common_1.Logger(GetQuestionGroupsByQuestionHandler_1.name);
    constructor(questionGroupMappingService) {
        this.questionGroupMappingService = questionGroupMappingService;
    }
    async execute(query) {
        this.logger.log('질문이 속한 그룹 목록 조회 시작', query);
        const mappings = await this.questionGroupMappingService.질문ID로조회한다(query.questionId);
        return mappings.map((mapping) => mapping.DTO로_변환한다());
    }
};
exports.GetQuestionGroupsByQuestionHandler = GetQuestionGroupsByQuestionHandler;
exports.GetQuestionGroupsByQuestionHandler = GetQuestionGroupsByQuestionHandler = GetQuestionGroupsByQuestionHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(GetQuestionGroupsByQuestionQuery),
    __metadata("design:paramtypes", [question_group_mapping_service_1.QuestionGroupMappingService])
], GetQuestionGroupsByQuestionHandler);
//# sourceMappingURL=get-question-groups-by-question.handler.js.map