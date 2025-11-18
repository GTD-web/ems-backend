"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessModule = void 0;
const common_1 = require("@nestjs/common");
const peer_evaluation_business_module_1 = require("./peer-evaluation/peer-evaluation-business.module");
const wbs_assignment_business_module_1 = require("./wbs-assignment/wbs-assignment-business.module");
const evaluation_period_business_module_1 = require("./evaluation-period/evaluation-period-business.module");
const evaluation_target_business_module_1 = require("./evaluation-target/evaluation-target-business.module");
const downward_evaluation_business_module_1 = require("./downward-evaluation/downward-evaluation-business.module");
const wbs_self_evaluation_business_module_1 = require("./wbs-self-evaluation/wbs-self-evaluation-business.module");
const step_approval_business_module_1 = require("./step-approval/step-approval-business.module");
const deliverable_business_module_1 = require("./deliverable/deliverable-business.module");
const revision_request_business_module_1 = require("./revision-request/revision-request-business.module");
const evaluation_criteria_business_module_1 = require("./evaluation-criteria/evaluation-criteria-business.module");
const project_assignment_business_module_1 = require("./project-assignment/project-assignment-business.module");
const evaluation_line_business_module_1 = require("./evaluation-line/evaluation-line-business.module");
const final_evaluation_business_module_1 = require("./final-evaluation/final-evaluation-business.module");
let BusinessModule = class BusinessModule {
};
exports.BusinessModule = BusinessModule;
exports.BusinessModule = BusinessModule = __decorate([
    (0, common_1.Module)({
        imports: [
            peer_evaluation_business_module_1.PeerEvaluationBusinessModule,
            wbs_assignment_business_module_1.WbsAssignmentBusinessModule,
            downward_evaluation_business_module_1.DownwardEvaluationBusinessModule,
            evaluation_period_business_module_1.EvaluationPeriodBusinessModule,
            evaluation_target_business_module_1.EvaluationTargetBusinessModule,
            wbs_self_evaluation_business_module_1.WbsSelfEvaluationBusinessModule,
            step_approval_business_module_1.StepApprovalBusinessModule,
            deliverable_business_module_1.DeliverableBusinessModule,
            revision_request_business_module_1.RevisionRequestBusinessModule,
            evaluation_criteria_business_module_1.EvaluationCriteriaBusinessModule,
            project_assignment_business_module_1.ProjectAssignmentBusinessModule,
            evaluation_line_business_module_1.EvaluationLineBusinessModule,
            final_evaluation_business_module_1.FinalEvaluationBusinessModule,
        ],
        exports: [
            peer_evaluation_business_module_1.PeerEvaluationBusinessModule,
            wbs_assignment_business_module_1.WbsAssignmentBusinessModule,
            downward_evaluation_business_module_1.DownwardEvaluationBusinessModule,
            evaluation_period_business_module_1.EvaluationPeriodBusinessModule,
            evaluation_target_business_module_1.EvaluationTargetBusinessModule,
            wbs_self_evaluation_business_module_1.WbsSelfEvaluationBusinessModule,
            step_approval_business_module_1.StepApprovalBusinessModule,
            deliverable_business_module_1.DeliverableBusinessModule,
            revision_request_business_module_1.RevisionRequestBusinessModule,
            evaluation_criteria_business_module_1.EvaluationCriteriaBusinessModule,
            project_assignment_business_module_1.ProjectAssignmentBusinessModule,
            evaluation_line_business_module_1.EvaluationLineBusinessModule,
            final_evaluation_business_module_1.FinalEvaluationBusinessModule,
        ],
    })
], BusinessModule);
//# sourceMappingURL=business.module.js.map