"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationPeriodManagementContextModule = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const typeorm_1 = require("@nestjs/typeorm");
const evaluation_period_module_1 = require("../../domain/core/evaluation-period/evaluation-period.module");
const evaluation_period_employee_mapping_module_1 = require("../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.module");
const evaluation_period_entity_1 = require("../../domain/core/evaluation-period/evaluation-period.entity");
const employee_entity_1 = require("../../domain/common/employee/employee.entity");
const evaluation_period_management_service_1 = require("./evaluation-period-management.service");
const handlers_1 = require("./handlers");
let EvaluationPeriodManagementContextModule = class EvaluationPeriodManagementContextModule {
};
exports.EvaluationPeriodManagementContextModule = EvaluationPeriodManagementContextModule;
exports.EvaluationPeriodManagementContextModule = EvaluationPeriodManagementContextModule = __decorate([
    (0, common_1.Module)({
        imports: [
            cqrs_1.CqrsModule,
            typeorm_1.TypeOrmModule.forFeature([evaluation_period_entity_1.EvaluationPeriod, employee_entity_1.Employee]),
            evaluation_period_module_1.EvaluationPeriodModule,
            evaluation_period_employee_mapping_module_1.EvaluationPeriodEmployeeMappingModule,
        ],
        providers: [
            evaluation_period_management_service_1.EvaluationPeriodManagementContextService,
            ...handlers_1.COMMAND_HANDLERS,
            ...handlers_1.QUERY_HANDLERS,
        ],
        exports: [evaluation_period_management_service_1.EvaluationPeriodManagementContextService],
    })
], EvaluationPeriodManagementContextModule);
//# sourceMappingURL=evaluation-period-management-context.module.js.map