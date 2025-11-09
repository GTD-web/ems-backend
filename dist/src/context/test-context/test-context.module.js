"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestContextModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const cqrs_1 = require("@nestjs/cqrs");
const test_context_service_1 = require("./test-context.service");
const department_test_module_1 = require("../../domain/common/department/department-test.module");
const employee_test_module_1 = require("../../domain/common/employee/employee-test.module");
const project_test_module_1 = require("../../domain/common/project/project-test.module");
const wbs_item_test_module_1 = require("../../domain/common/wbs-item/wbs-item-test.module");
const evaluation_period_entity_1 = require("../../domain/core/evaluation-period/evaluation-period.entity");
const evaluation_wbs_assignment_entity_1 = require("../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity");
const evaluation_project_assignment_entity_1 = require("../../domain/core/evaluation-project-assignment/evaluation-project-assignment.entity");
const evaluation_line_entity_1 = require("../../domain/core/evaluation-line/evaluation-line.entity");
const evaluation_line_mapping_entity_1 = require("../../domain/core/evaluation-line-mapping/evaluation-line-mapping.entity");
const question_group_entity_1 = require("../../domain/sub/question-group/question-group.entity");
const evaluation_question_entity_1 = require("../../domain/sub/evaluation-question/evaluation-question.entity");
const question_group_mapping_entity_1 = require("../../domain/sub/question-group-mapping/question-group-mapping.entity");
const commands_1 = require("./commands");
const queries_1 = require("./queries");
let TestContextModule = class TestContextModule {
};
exports.TestContextModule = TestContextModule;
exports.TestContextModule = TestContextModule = __decorate([
    (0, common_1.Module)({
        imports: [
            cqrs_1.CqrsModule,
            typeorm_1.TypeOrmModule.forFeature([
                evaluation_period_entity_1.EvaluationPeriod,
                evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment,
                evaluation_project_assignment_entity_1.EvaluationProjectAssignment,
                evaluation_line_entity_1.EvaluationLine,
                evaluation_line_mapping_entity_1.EvaluationLineMapping,
                question_group_entity_1.QuestionGroup,
                evaluation_question_entity_1.EvaluationQuestion,
                question_group_mapping_entity_1.QuestionGroupMapping,
            ]),
            department_test_module_1.DepartmentTestModule,
            employee_test_module_1.EmployeeTestModule,
            project_test_module_1.ProjectTestModule,
            wbs_item_test_module_1.WbsItemTestModule,
        ],
        providers: [test_context_service_1.TestContextService, ...commands_1.COMMAND_HANDLERS, ...queries_1.QUERY_HANDLERS],
        exports: [test_context_service_1.TestContextService],
    })
], TestContextModule);
//# sourceMappingURL=test-context.module.js.map