"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubDomainModule = void 0;
const common_1 = require("@nestjs/common");
const question_group_module_1 = require("./question-group/question-group.module");
const evaluation_question_module_1 = require("./evaluation-question/evaluation-question.module");
const question_group_mapping_module_1 = require("./question-group-mapping/question-group-mapping.module");
const evaluation_response_module_1 = require("./evaluation-response/evaluation-response.module");
const employee_evaluation_step_approval_module_1 = require("./employee-evaluation-step-approval/employee-evaluation-step-approval.module");
const evaluation_revision_request_module_1 = require("./evaluation-revision-request/evaluation-revision-request.module");
let SubDomainModule = class SubDomainModule {
};
exports.SubDomainModule = SubDomainModule;
exports.SubDomainModule = SubDomainModule = __decorate([
    (0, common_1.Module)({
        imports: [
            question_group_module_1.QuestionGroupModule,
            evaluation_question_module_1.EvaluationQuestionModule,
            question_group_mapping_module_1.QuestionGroupMappingModule,
            evaluation_response_module_1.EvaluationResponseModule,
            employee_evaluation_step_approval_module_1.EmployeeEvaluationStepApprovalModule,
            evaluation_revision_request_module_1.EvaluationRevisionRequestModule,
        ],
        exports: [
            question_group_module_1.QuestionGroupModule,
            evaluation_question_module_1.EvaluationQuestionModule,
            question_group_mapping_module_1.QuestionGroupMappingModule,
            evaluation_response_module_1.EvaluationResponseModule,
            employee_evaluation_step_approval_module_1.EmployeeEvaluationStepApprovalModule,
            evaluation_revision_request_module_1.EvaluationRevisionRequestModule,
        ],
    })
], SubDomainModule);
//# sourceMappingURL=sub-domain.module.js.map