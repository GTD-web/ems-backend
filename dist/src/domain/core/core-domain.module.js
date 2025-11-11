"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoreDomainModule = void 0;
const common_1 = require("@nestjs/common");
const deliverable_module_1 = require("./deliverable/deliverable.module");
const downward_evaluation_module_1 = require("./downward-evaluation/downward-evaluation.module");
const evaluation_line_module_1 = require("./evaluation-line/evaluation-line.module");
const evaluation_line_mapping_module_1 = require("./evaluation-line-mapping/evaluation-line-mapping.module");
const evaluation_period_module_1 = require("./evaluation-period/evaluation-period.module");
const evaluation_period_employee_mapping_module_1 = require("./evaluation-period-employee-mapping/evaluation-period-employee-mapping.module");
const peer_evaluation_module_1 = require("./peer-evaluation/peer-evaluation.module");
const peer_evaluation_question_mapping_module_1 = require("./peer-evaluation-question-mapping/peer-evaluation-question-mapping.module");
const final_evaluation_module_1 = require("./final-evaluation/final-evaluation.module");
const wbs_evaluation_criteria_module_1 = require("./wbs-evaluation-criteria/wbs-evaluation-criteria.module");
const wbs_self_evaluation_module_1 = require("./wbs-self-evaluation/wbs-self-evaluation.module");
const evaluation_wbs_assignment_1 = require("./evaluation-wbs-assignment");
const evaluation_project_assignment_module_1 = require("./evaluation-project-assignment/evaluation-project-assignment.module");
const evaluation_activity_log_module_1 = require("./evaluation-activity-log/evaluation-activity-log.module");
let CoreDomainModule = class CoreDomainModule {
};
exports.CoreDomainModule = CoreDomainModule;
exports.CoreDomainModule = CoreDomainModule = __decorate([
    (0, common_1.Module)({
        imports: [
            evaluation_period_module_1.EvaluationPeriodModule,
            evaluation_period_employee_mapping_module_1.EvaluationPeriodEmployeeMappingModule,
            evaluation_project_assignment_module_1.EvaluationProjectAssignmentModule,
            evaluation_wbs_assignment_1.EvaluationWbsAssignmentModule,
            wbs_evaluation_criteria_module_1.WbsEvaluationCriteriaModule,
            evaluation_line_module_1.EvaluationLineModule,
            wbs_self_evaluation_module_1.WbsSelfEvaluationModule,
            downward_evaluation_module_1.DownwardEvaluationModule,
            peer_evaluation_module_1.PeerEvaluationModule,
            final_evaluation_module_1.FinalEvaluationModule,
            deliverable_module_1.DeliverableModule,
            evaluation_activity_log_module_1.EvaluationActivityLogModule,
            evaluation_line_mapping_module_1.EvaluationLineMappingModule,
            peer_evaluation_question_mapping_module_1.PeerEvaluationQuestionMappingModule,
        ],
        exports: [
            evaluation_period_module_1.EvaluationPeriodModule,
            evaluation_period_employee_mapping_module_1.EvaluationPeriodEmployeeMappingModule,
            evaluation_project_assignment_module_1.EvaluationProjectAssignmentModule,
            evaluation_wbs_assignment_1.EvaluationWbsAssignmentModule,
            wbs_evaluation_criteria_module_1.WbsEvaluationCriteriaModule,
            evaluation_line_module_1.EvaluationLineModule,
            wbs_self_evaluation_module_1.WbsSelfEvaluationModule,
            downward_evaluation_module_1.DownwardEvaluationModule,
            peer_evaluation_module_1.PeerEvaluationModule,
            final_evaluation_module_1.FinalEvaluationModule,
            deliverable_module_1.DeliverableModule,
            evaluation_activity_log_module_1.EvaluationActivityLogModule,
            evaluation_line_mapping_module_1.EvaluationLineMappingModule,
            peer_evaluation_question_mapping_module_1.PeerEvaluationQuestionMappingModule,
        ],
    })
], CoreDomainModule);
//# sourceMappingURL=core-domain.module.js.map