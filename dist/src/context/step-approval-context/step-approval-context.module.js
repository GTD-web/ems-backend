"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StepApprovalContextModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const step_approval_context_service_1 = require("./step-approval-context.service");
const employee_evaluation_step_approval_1 = require("../../domain/sub/employee-evaluation-step-approval");
const evaluation_revision_request_1 = require("../../domain/sub/evaluation-revision-request");
const evaluation_period_employee_mapping_entity_1 = require("../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity");
const evaluation_line_mapping_entity_1 = require("../../domain/core/evaluation-line-mapping/evaluation-line-mapping.entity");
let StepApprovalContextModule = class StepApprovalContextModule {
};
exports.StepApprovalContextModule = StepApprovalContextModule;
exports.StepApprovalContextModule = StepApprovalContextModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                evaluation_period_employee_mapping_entity_1.EvaluationPeriodEmployeeMapping,
                evaluation_line_mapping_entity_1.EvaluationLineMapping,
            ]),
            employee_evaluation_step_approval_1.EmployeeEvaluationStepApprovalModule,
            evaluation_revision_request_1.EvaluationRevisionRequestModule,
        ],
        providers: [step_approval_context_service_1.StepApprovalContextService],
        exports: [step_approval_context_service_1.StepApprovalContextService],
    })
], StepApprovalContextModule);
//# sourceMappingURL=step-approval-context.module.js.map