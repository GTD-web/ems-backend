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
var GetQuestionGroupHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetQuestionGroupHandler = exports.GetQuestionGroupQuery = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const question_group_service_1 = require("../../../../../domain/sub/question-group/question-group.service");
class GetQuestionGroupQuery {
    id;
    constructor(id) {
        this.id = id;
    }
}
exports.GetQuestionGroupQuery = GetQuestionGroupQuery;
let GetQuestionGroupHandler = GetQuestionGroupHandler_1 = class GetQuestionGroupHandler {
    questionGroupService;
    logger = new common_1.Logger(GetQuestionGroupHandler_1.name);
    constructor(questionGroupService) {
        this.questionGroupService = questionGroupService;
    }
    async execute(query) {
        this.logger.log('질문 그룹 조회 시작', query);
        const questionGroup = await this.questionGroupService.ID로조회한다(query.id);
        if (!questionGroup) {
            throw new common_1.NotFoundException(`질문 그룹을 찾을 수 없습니다. (id: ${query.id})`);
        }
        return questionGroup.DTO로_변환한다();
    }
};
exports.GetQuestionGroupHandler = GetQuestionGroupHandler;
exports.GetQuestionGroupHandler = GetQuestionGroupHandler = GetQuestionGroupHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(GetQuestionGroupQuery),
    __metadata("design:paramtypes", [question_group_service_1.QuestionGroupService])
], GetQuestionGroupHandler);
//# sourceMappingURL=get-question-group.handler.js.map