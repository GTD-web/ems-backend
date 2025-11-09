"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationQuestionManagementContextModule = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const question_group_module_1 = require("../../domain/sub/question-group/question-group.module");
const evaluation_question_module_1 = require("../../domain/sub/evaluation-question/evaluation-question.module");
const question_group_mapping_module_1 = require("../../domain/sub/question-group-mapping/question-group-mapping.module");
const evaluation_response_module_1 = require("../../domain/sub/evaluation-response/evaluation-response.module");
const evaluation_question_management_service_1 = require("./evaluation-question-management.service");
const handlers_1 = require("./handlers");
let EvaluationQuestionManagementContextModule = class EvaluationQuestionManagementContextModule {
};
exports.EvaluationQuestionManagementContextModule = EvaluationQuestionManagementContextModule;
exports.EvaluationQuestionManagementContextModule = EvaluationQuestionManagementContextModule = __decorate([
    (0, common_1.Module)({
        imports: [
            cqrs_1.CqrsModule,
            question_group_module_1.QuestionGroupModule,
            evaluation_question_module_1.EvaluationQuestionModule,
            question_group_mapping_module_1.QuestionGroupMappingModule,
            evaluation_response_module_1.EvaluationResponseModule,
        ],
        providers: [
            evaluation_question_management_service_1.EvaluationQuestionManagementService,
            ...handlers_1.COMMAND_HANDLERS,
            ...handlers_1.QUERY_HANDLERS,
        ],
        exports: [evaluation_question_management_service_1.EvaluationQuestionManagementService],
    })
], EvaluationQuestionManagementContextModule);
//# sourceMappingURL=evaluation-question-management-context.module.js.map