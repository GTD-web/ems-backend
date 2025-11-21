"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WbsSelfEvaluationBusinessModule = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const performance_evaluation_context_module_1 = require("../../context/performance-evaluation-context/performance-evaluation-context.module");
const revision_request_context_module_1 = require("../../context/revision-request-context/revision-request-context.module");
const step_approval_context_module_1 = require("../../context/step-approval-context/step-approval-context.module");
const evaluation_activity_log_context_module_1 = require("../../context/evaluation-activity-log-context/evaluation-activity-log-context.module");
const wbs_self_evaluation_business_service_1 = require("./wbs-self-evaluation-business.service");
let WbsSelfEvaluationBusinessModule = class WbsSelfEvaluationBusinessModule {
};
exports.WbsSelfEvaluationBusinessModule = WbsSelfEvaluationBusinessModule;
exports.WbsSelfEvaluationBusinessModule = WbsSelfEvaluationBusinessModule = __decorate([
    (0, common_1.Module)({
        imports: [
            cqrs_1.CqrsModule,
            performance_evaluation_context_module_1.PerformanceEvaluationContextModule,
            revision_request_context_module_1.RevisionRequestContextModule,
            step_approval_context_module_1.StepApprovalContextModule,
            evaluation_activity_log_context_module_1.EvaluationActivityLogContextModule,
        ],
        providers: [wbs_self_evaluation_business_service_1.WbsSelfEvaluationBusinessService],
        exports: [wbs_self_evaluation_business_service_1.WbsSelfEvaluationBusinessService],
    })
], WbsSelfEvaluationBusinessModule);
//# sourceMappingURL=wbs-self-evaluation-business.module.js.map