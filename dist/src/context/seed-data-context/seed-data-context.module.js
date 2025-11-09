"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedDataContextModule = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const typeorm_1 = require("@nestjs/typeorm");
const organization_management_context_module_1 = require("../organization-management-context/organization-management-context.module");
const department_module_1 = require("../../domain/common/department/department.module");
const employee_module_1 = require("../../domain/common/employee/employee.module");
const department_entity_1 = require("../../domain/common/department/department.entity");
const employee_entity_1 = require("../../domain/common/employee/employee.entity");
const project_entity_1 = require("../../domain/common/project/project.entity");
const wbs_item_entity_1 = require("../../domain/common/wbs-item/wbs-item.entity");
const evaluation_period_entity_1 = require("../../domain/core/evaluation-period/evaluation-period.entity");
const evaluation_period_employee_mapping_entity_1 = require("../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity");
const evaluation_project_assignment_entity_1 = require("../../domain/core/evaluation-project-assignment/evaluation-project-assignment.entity");
const evaluation_wbs_assignment_entity_1 = require("../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity");
const wbs_evaluation_criteria_entity_1 = require("../../domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity");
const evaluation_line_entity_1 = require("../../domain/core/evaluation-line/evaluation-line.entity");
const evaluation_line_mapping_entity_1 = require("../../domain/core/evaluation-line-mapping/evaluation-line-mapping.entity");
const deliverable_entity_1 = require("../../domain/core/deliverable/deliverable.entity");
const question_group_entity_1 = require("../../domain/sub/question-group/question-group.entity");
const evaluation_question_entity_1 = require("../../domain/sub/evaluation-question/evaluation-question.entity");
const question_group_mapping_entity_1 = require("../../domain/sub/question-group-mapping/question-group-mapping.entity");
const wbs_self_evaluation_entity_1 = require("../../domain/core/wbs-self-evaluation/wbs-self-evaluation.entity");
const downward_evaluation_entity_1 = require("../../domain/core/downward-evaluation/downward-evaluation.entity");
const peer_evaluation_entity_1 = require("../../domain/core/peer-evaluation/peer-evaluation.entity");
const final_evaluation_entity_1 = require("../../domain/core/final-evaluation/final-evaluation.entity");
const evaluation_response_entity_1 = require("../../domain/sub/evaluation-response/evaluation-response.entity");
const generators_1 = require("./generators");
const handlers_1 = require("./handlers");
const seed_data_service_1 = require("./seed-data.service");
const wbs_assignment_weight_calculation_service_1 = require("../evaluation-criteria-management-context/services/wbs-assignment-weight-calculation.service");
let SeedDataContextModule = class SeedDataContextModule {
};
exports.SeedDataContextModule = SeedDataContextModule;
exports.SeedDataContextModule = SeedDataContextModule = __decorate([
    (0, common_1.Module)({
        imports: [
            cqrs_1.CqrsModule,
            organization_management_context_module_1.OrganizationManagementContextModule,
            department_module_1.DepartmentModule,
            employee_module_1.EmployeeModule,
            typeorm_1.TypeOrmModule.forFeature([
                department_entity_1.Department,
                employee_entity_1.Employee,
                project_entity_1.Project,
                wbs_item_entity_1.WbsItem,
                evaluation_period_entity_1.EvaluationPeriod,
                evaluation_period_employee_mapping_entity_1.EvaluationPeriodEmployeeMapping,
                evaluation_project_assignment_entity_1.EvaluationProjectAssignment,
                evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment,
                wbs_evaluation_criteria_entity_1.WbsEvaluationCriteria,
                evaluation_line_entity_1.EvaluationLine,
                evaluation_line_mapping_entity_1.EvaluationLineMapping,
                deliverable_entity_1.Deliverable,
                question_group_entity_1.QuestionGroup,
                evaluation_question_entity_1.EvaluationQuestion,
                question_group_mapping_entity_1.QuestionGroupMapping,
                wbs_self_evaluation_entity_1.WbsSelfEvaluation,
                downward_evaluation_entity_1.DownwardEvaluation,
                peer_evaluation_entity_1.PeerEvaluation,
                final_evaluation_entity_1.FinalEvaluation,
                evaluation_response_entity_1.EvaluationResponse,
            ]),
        ],
        providers: [
            seed_data_service_1.SeedDataService,
            wbs_assignment_weight_calculation_service_1.WbsAssignmentWeightCalculationService,
            generators_1.Phase1OrganizationGenerator,
            generators_1.Phase2EvaluationPeriodGenerator,
            generators_1.Phase3AssignmentGenerator,
            generators_1.Phase4EvaluationCriteriaGenerator,
            generators_1.Phase5DeliverableGenerator,
            generators_1.Phase6QuestionGenerator,
            generators_1.Phase7EvaluationGenerator,
            generators_1.Phase8ResponseGenerator,
            ...handlers_1.CommandHandlers,
            ...handlers_1.QueryHandlers,
        ],
        exports: [seed_data_service_1.SeedDataService],
    })
], SeedDataContextModule);
//# sourceMappingURL=seed-data-context.module.js.map