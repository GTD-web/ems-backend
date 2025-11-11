"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevisionRequestContextModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const revision_request_context_service_1 = require("./revision-request-context.service");
const evaluation_revision_request_1 = require("../../domain/sub/evaluation-revision-request");
const employee_evaluation_step_approval_1 = require("../../domain/sub/employee-evaluation-step-approval");
const employee_entity_1 = require("../../domain/common/employee/employee.entity");
const evaluation_period_entity_1 = require("../../domain/core/evaluation-period/evaluation-period.entity");
const evaluation_period_employee_mapping_entity_1 = require("../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity");
let RevisionRequestContextModule = class RevisionRequestContextModule {
};
exports.RevisionRequestContextModule = RevisionRequestContextModule;
exports.RevisionRequestContextModule = RevisionRequestContextModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                employee_entity_1.Employee,
                evaluation_period_entity_1.EvaluationPeriod,
                evaluation_period_employee_mapping_entity_1.EvaluationPeriodEmployeeMapping,
            ]),
            evaluation_revision_request_1.EvaluationRevisionRequestModule,
            employee_evaluation_step_approval_1.EmployeeEvaluationStepApprovalModule,
        ],
        providers: [revision_request_context_service_1.RevisionRequestContextService],
        exports: [revision_request_context_service_1.RevisionRequestContextService],
    })
], RevisionRequestContextModule);
//# sourceMappingURL=revision-request-context.module.js.map